package common

import (
	"bytes"
	"crypto/rand"
	"crypto/subtle"
	"image"
	"image/color"
	"image/png"
	"math/big"
	mrand "math/rand"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	xdraw "golang.org/x/image/draw"
	"golang.org/x/image/font"
	"golang.org/x/image/font/basicfont"
	"golang.org/x/image/math/fixed"
)

const (
	CaptchaCodeLength    = 4
	CaptchaValidDuration = 5 * time.Minute

	captchaMaxStoreSize = 10000
	captchaFontScale    = 4
	captchaImageWidth   = 160
	captchaImageHeight  = 60
	captchaRedisPrefix  = "captcha:"
)

// 去掉了容易混淆的 I/O/0/1
const captchaCharset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

type captchaEntry struct {
	code      string
	expiresAt time.Time
}

var (
	captchaMutex sync.Mutex
	captchaStore = make(map[string]captchaEntry)
)

func captchaUseRedis() bool {
	return RedisEnabled && RDB != nil
}

// GenerateCaptchaID 生成验证码会话 ID
func GenerateCaptchaID() string {
	return strings.ReplaceAll(uuid.NewString(), "-", "")
}

// GenerateCaptchaCode 生成随机验证码文本
func GenerateCaptchaCode() string {
	b := make([]byte, CaptchaCodeLength)
	for i := range b {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(captchaCharset))))
		if err != nil {
			b[i] = captchaCharset[i%len(captchaCharset)]
			continue
		}
		b[i] = captchaCharset[n.Int64()]
	}
	return string(b)
}

// RegisterCaptcha 保存验证码，多节点启用 Redis 时共享存储
func RegisterCaptcha(id string, code string) {
	if id == "" || code == "" {
		return
	}
	if captchaUseRedis() {
		if err := RedisSet(captchaRedisPrefix+id, code, CaptchaValidDuration); err == nil {
			return
		}
	}
	captchaMutex.Lock()
	defer captchaMutex.Unlock()
	captchaStore[id] = captchaEntry{
		code:      code,
		expiresAt: time.Now().Add(CaptchaValidDuration),
	}
	if len(captchaStore) > captchaMaxStoreSize {
		removeExpiredCaptchas()
	}
}

// VerifyCaptcha 校验并消费验证码，不区分大小写，一次性使用
func VerifyCaptcha(id string, code string) bool {
	if id == "" || code == "" {
		return false
	}
	if captchaUseRedis() {
		stored, err := RedisGet(captchaRedisPrefix + id)
		if err != nil {
			return false
		}
		_ = RedisDel(captchaRedisPrefix + id)
		return equalCaptchaCode(stored, code)
	}
	captchaMutex.Lock()
	entry, ok := captchaStore[id]
	delete(captchaStore, id)
	captchaMutex.Unlock()
	if !ok || time.Now().After(entry.expiresAt) {
		return false
	}
	return equalCaptchaCode(entry.code, code)
}

func equalCaptchaCode(expected string, provided string) bool {
	a := strings.ToUpper(strings.TrimSpace(expected))
	b := strings.ToUpper(strings.TrimSpace(provided))
	return subtle.ConstantTimeCompare([]byte(a), []byte(b)) == 1
}

// no lock inside, so the caller must lock captchaMutex before calling!
func removeExpiredCaptchas() {
	now := time.Now()
	for key, entry := range captchaStore {
		if now.After(entry.expiresAt) {
			delete(captchaStore, key)
		}
	}
}

// CaptchaImage 将验证码渲染为 PNG 图片
func CaptchaImage(code string) ([]byte, error) {
	smallW := captchaImageWidth / captchaFontScale
	smallH := captchaImageHeight / captchaFontScale

	small := image.NewRGBA(image.Rect(0, 0, smallW, smallH))
	fillRect(small, small.Bounds(), color.RGBA{R: 255, G: 255, B: 255, A: 255})

	glyphWidth := 7
	startX := (smallW - glyphWidth*len(code)) / 2
	if startX < 1 {
		startX = 1
	}
	baseline := smallH/2 + 4

	for i, ch := range code {
		drawer := &font.Drawer{
			Dst:  small,
			Src:  image.NewUniform(captchaDarkColor()),
			Face: basicfont.Face7x13,
			Dot:  fixed.P(startX+i*glyphWidth, baseline),
		}
		drawer.DrawString(string(ch))
	}

	img := image.NewRGBA(image.Rect(0, 0, captchaImageWidth, captchaImageHeight))
	xdraw.NearestNeighbor.Scale(img, img.Bounds(), small, small.Bounds(), xdraw.Over, nil)

	captchaDrawNoise(img)

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func fillRect(img *image.RGBA, r image.Rectangle, c color.Color) {
	for y := r.Min.Y; y < r.Max.Y; y++ {
		for x := r.Min.X; x < r.Max.X; x++ {
			img.Set(x, y, c)
		}
	}
}

func captchaDrawNoise(img *image.RGBA) {
	bounds := img.Bounds()
	for i := 0; i < 4; i++ {
		x1 := mrand.Intn(bounds.Dx())
		y1 := mrand.Intn(bounds.Dy())
		x2 := mrand.Intn(bounds.Dx())
		y2 := mrand.Intn(bounds.Dy())
		captchaDrawLine(img, x1, y1, x2, y2, captchaLightColor())
	}
	for i := 0; i < 60; i++ {
		x := mrand.Intn(bounds.Dx())
		y := mrand.Intn(bounds.Dy())
		img.Set(x, y, captchaLightColor())
	}
}

func captchaDrawLine(img *image.RGBA, x0, y0, x1, y1 int, c color.Color) {
	dx := captchaAbs(x1 - x0)
	dy := -captchaAbs(y1 - y0)
	sx := -1
	if x0 < x1 {
		sx = 1
	}
	sy := -1
	if y0 < y1 {
		sy = 1
	}
	err := dx + dy
	for {
		img.Set(x0, y0, c)
		if x0 == x1 && y0 == y1 {
			return
		}
		e2 := 2 * err
		if e2 >= dy {
			err += dy
			x0 += sx
		}
		if e2 <= dx {
			err += dx
			y0 += sy
		}
	}
}

func captchaAbs(v int) int {
	if v < 0 {
		return -v
	}
	return v
}

func captchaDarkColor() color.RGBA {
	return color.RGBA{
		R: uint8(20 + mrand.Intn(90)),
		G: uint8(20 + mrand.Intn(90)),
		B: uint8(20 + mrand.Intn(90)),
		A: 255,
	}
}

func captchaLightColor() color.RGBA {
	return color.RGBA{
		R: uint8(120 + mrand.Intn(110)),
		G: uint8(120 + mrand.Intn(110)),
		B: uint8(120 + mrand.Intn(110)),
		A: 255,
	}
}
