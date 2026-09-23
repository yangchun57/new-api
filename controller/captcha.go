package controller

import (
	"encoding/base64"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"

	"github.com/gin-gonic/gin"
)

// GetCaptcha 生成图形验证码，返回会话 ID 与 base64 图片
func GetCaptcha(c *gin.Context) {
	if !common.CaptchaEnabled {
		common.ApiErrorI18n(c, i18n.MsgFeatureDisabled)
		return
	}

	code := common.GenerateCaptchaCode()
	imageBytes, err := common.CaptchaImage(code)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	id := common.GenerateCaptchaID()
	common.RegisterCaptcha(id, code)

	common.ApiSuccess(c, gin.H{
		"captcha_id":    id,
		"captcha_image": "data:image/png;base64," + base64.StdEncoding.EncodeToString(imageBytes),
	})
}
