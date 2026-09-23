package controller

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const maxHomeBannerSize = 5 << 20 // 5MB

var homeBannerImageExt = map[string]string{
	"image/png":  ".png",
	"image/jpeg": ".jpg",
	"image/gif":  ".gif",
	"image/webp": ".webp",
}

// UploadHomeBanner 管理员上传首页 banner 图片，返回可公开访问的 URL
func UploadHomeBanner(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxHomeBannerSize+(1<<20))

	fileHeader, err := c.FormFile("file")
	if err != nil {
		common.ApiErrorI18n(c, i18n.MsgFileInvalidImage)
		return
	}
	if fileHeader.Size <= 0 || fileHeader.Size > maxHomeBannerSize {
		common.ApiErrorI18n(c, i18n.MsgFileImageTooLarge, map[string]any{"Max": maxHomeBannerSize >> 20})
		return
	}

	src, err := fileHeader.Open()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	defer src.Close()

	head := make([]byte, 512)
	n, err := io.ReadFull(src, head)
	if err != nil && err != io.ErrUnexpectedEOF && err != io.EOF {
		common.ApiError(c, err)
		return
	}

	ext, ok := homeBannerImageExt[http.DetectContentType(head[:n])]
	if !ok {
		common.ApiErrorI18n(c, i18n.MsgFileInvalidImage)
		return
	}

	dir, err := common.EnsureHomeBannerDir()
	if err != nil {
		common.ApiError(c, err)
		return
	}

	filename := "banner-" + strings.ReplaceAll(uuid.NewString(), "-", "") + ext
	dst, err := os.Create(filepath.Join(dir, filename))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	defer dst.Close()

	if _, err := dst.Write(head[:n]); err != nil {
		common.ApiError(c, err)
		return
	}
	if _, err := io.Copy(dst, io.LimitReader(src, maxHomeBannerSize)); err != nil {
		common.ApiError(c, err)
		return
	}

	common.ApiSuccess(c, gin.H{"url": common.HomeBannerURLPrefix + "/" + filename})
}
