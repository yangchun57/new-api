package common

import (
	"bytes"
	"image/png"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCaptchaCodeGeneration(t *testing.T) {
	code := GenerateCaptchaCode()
	require.Len(t, code, CaptchaCodeLength)
	for _, ch := range code {
		assert.Contains(t, captchaCharset, string(ch))
	}
	assert.NotEmpty(t, GenerateCaptchaID())
}

func TestVerifyCaptcha(t *testing.T) {
	originalRedisEnabled := RedisEnabled
	RedisEnabled = false
	t.Cleanup(func() { RedisEnabled = originalRedisEnabled })

	id := GenerateCaptchaID()
	RegisterCaptcha(id, "AB2C")

	assert.False(t, VerifyCaptcha(id, "ZZZZ"), "wrong code must be rejected")

	RegisterCaptcha(id, "AB2C")
	assert.True(t, VerifyCaptcha(id, "ab2c"), "verification is case-insensitive")
	assert.False(t, VerifyCaptcha(id, "ab2c"), "captcha is single-use")

	assert.False(t, VerifyCaptcha("missing-id", "AB2C"))
	assert.False(t, VerifyCaptcha("", "AB2C"))
	assert.False(t, VerifyCaptcha(id, ""))
}

func TestCaptchaImage(t *testing.T) {
	imageBytes, err := CaptchaImage("AB2C")
	require.NoError(t, err)

	img, err := png.Decode(bytes.NewReader(imageBytes))
	require.NoError(t, err)
	assert.Equal(t, captchaImageWidth, img.Bounds().Dx())
	assert.Equal(t, captchaImageHeight, img.Bounds().Dy())

	nonWhite := 0
	for y := img.Bounds().Min.Y; y < img.Bounds().Max.Y; y++ {
		for x := img.Bounds().Min.X; x < img.Bounds().Max.X; x++ {
			r, g, b, _ := img.At(x, y).RGBA()
			if r>>8 < 250 || g>>8 < 250 || b>>8 < 250 {
				nonWhite++
			}
		}
	}
	assert.Greater(t, nonWhite, 100, "captcha image must contain rendered glyphs")
}
