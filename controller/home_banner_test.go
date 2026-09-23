package controller

import (
	"bytes"
	"image"
	"image/color"
	"image/png"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newBannerUploadContext(
	t *testing.T,
	filename string,
	content []byte,
) (*gin.Context, *httptest.ResponseRecorder) {
	t.Helper()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", filename)
	require.NoError(t, err)
	_, err = part.Write(content)
	require.NoError(t, err)
	require.NoError(t, writer.Close())

	recorder := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(recorder)
	c.Request = httptest.NewRequest(http.MethodPost, "/api/file/banner", body)
	c.Request.Header.Set("Content-Type", writer.FormDataContentType())
	return c, recorder
}

func samplePNG(t *testing.T) []byte {
	t.Helper()

	img := image.NewRGBA(image.Rect(0, 0, 2, 2))
	img.Set(0, 0, color.RGBA{R: 255, G: 255, B: 255, A: 255})
	var buf bytes.Buffer
	require.NoError(t, png.Encode(&buf, img))
	return buf.Bytes()
}

func TestUploadHomeBannerStoresImage(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	t.Setenv("HOME_BANNER_DIR", dir)

	c, recorder := newBannerUploadContext(t, "banner.png", samplePNG(t))
	UploadHomeBanner(c)

	body := recorder.Body.String()
	assert.Contains(t, body, `"success":true`)
	assert.Contains(t, body, common.HomeBannerURLPrefix)

	entries, err := os.ReadDir(dir)
	require.NoError(t, err)
	require.Len(t, entries, 1)
	assert.True(t, strings.HasPrefix(entries[0].Name(), "banner-"))
	assert.True(t, strings.HasSuffix(entries[0].Name(), ".png"))
}

func TestUploadHomeBannerRejectsNonImage(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	t.Setenv("HOME_BANNER_DIR", dir)

	c, recorder := newBannerUploadContext(t, "notes.txt", []byte("this is not an image"))
	UploadHomeBanner(c)

	assert.Contains(t, recorder.Body.String(), `"success":false`)
	entries, err := os.ReadDir(dir)
	require.NoError(t, err)
	assert.Empty(t, entries)
}

func TestUploadHomeBannerRejectsOversizedFile(t *testing.T) {
	gin.SetMode(gin.TestMode)
	dir := t.TempDir()
	t.Setenv("HOME_BANNER_DIR", dir)

	oversized := make([]byte, maxHomeBannerSize+1)
	copy(oversized, []byte("\x89PNG\r\n\x1a\n"))
	c, recorder := newBannerUploadContext(t, "big.png", oversized)
	UploadHomeBanner(c)

	assert.Contains(t, recorder.Body.String(), `"success":false`)
	entries, err := os.ReadDir(dir)
	require.NoError(t, err)
	assert.Empty(t, entries)
}
