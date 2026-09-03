package controller

import (
	"crypto"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

const wechatNativeApiHost = "https://api.mch.weixin.qq.com"

type WechatNativePayRequest struct {
	Amount        float64 `json:"amount"`
	PaymentMethod string  `json:"payment_method"`
}

type wechatNativeAmount struct {
	Total    int64  `json:"total"`
	Currency string `json:"currency"`
}

type wechatNativeCreateOrderRequest struct {
	AppId       string             `json:"appid"`
	MchId       string             `json:"mchid"`
	Description string             `json:"description"`
	OutTradeNo  string             `json:"out_trade_no"`
	NotifyUrl   string             `json:"notify_url"`
	Amount      wechatNativeAmount `json:"amount"`
}

type wechatNativeCreateOrderResponse struct {
	CodeUrl string `json:"code_url"`
}

type wechatPayError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Detail  struct {
		Field    string `json:"field"`
		Issue    string `json:"issue"`
	} `json:"detail"`
}

func parseWechatPayError(body []byte) string {
	var we wechatPayError
	if err := common.Unmarshal(body, &we); err != nil {
		return ""
	}
	msg := we.Message
	if msg == "" {
		return ""
	}
	if we.Code != "" {
		msg = fmt.Sprintf("[%s] %s", we.Code, msg)
	}
	if we.Detail.Field != "" {
		msg = fmt.Sprintf("%s (字段 %s: %s)", msg, we.Detail.Field, we.Detail.Issue)
	}
	return msg
}

type wechatNativeNotifyResource struct {
	Algorithm      string `json:"algorithm"`
	Ciphertext     string `json:"ciphertext"`
	AssociatedData string `json:"associated_data"`
	Nonce          string `json:"nonce"`
}

type wechatNativeNotifyBody struct {
	EventType string                     `json:"event_type"`
	Resource  wechatNativeNotifyResource `json:"resource"`
}

type wechatNativeTransaction struct {
	OutTradeNo string `json:"out_trade_no"`
	TradeState string `json:"trade_state"`
}

func getWechatNativeMinTopup() float64 {
	minTopup := setting.WechatNativeMinTopUp
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		minTopup = minTopup * common.QuotaPerUnit
	}
	return minTopup
}

// loadWechatNativePrivateKey 解析微信支付商户私钥（支持 PKCS#1 与 PKCS#8）。
func loadWechatNativePrivateKey(keyPem string) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode([]byte(keyPem))
	if block == nil {
		return nil, errors.New("商户私钥 PEM 解析失败")
	}
	if key, err := x509.ParsePKCS8PrivateKey(block.Bytes); err == nil {
		if rsaKey, ok := key.(*rsa.PrivateKey); ok {
			return rsaKey, nil
		}
		return nil, errors.New("商户私钥不是 RSA 私钥")
	}
	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return key, nil
	}
	return nil, errors.New("商户私钥格式不受支持")
}

// loadWechatNativePlatformCert 解析微信支付平台证书。
func loadWechatNativePlatformCert(certPem string) (*x509.Certificate, error) {
	block, _ := pem.Decode([]byte(certPem))
	if block == nil {
		return nil, errors.New("平台证书 PEM 解析失败")
	}
	return x509.ParseCertificate(block.Bytes)
}

// wechatNativeSign 使用商户私钥对消息做 SHA256withRSA 签名并返回 Base64。
func wechatNativeSign(privateKey *rsa.PrivateKey, message string) (string, error) {
	hashed := sha256.Sum256([]byte(message))
	signature, err := rsa.SignPKCS1v15(rand.Reader, privateKey, crypto.SHA256, hashed[:])
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(signature), nil
}

// wechatNativeVerify 使用平台证书验证回调签名。
func wechatNativeVerify(cert *x509.Certificate, message string, signatureB64 string) error {
	publicKey, ok := cert.PublicKey.(*rsa.PublicKey)
	if !ok {
		return errors.New("平台证书不是 RSA 证书")
	}
	signature, err := base64.StdEncoding.DecodeString(signatureB64)
	if err != nil {
		return err
	}
	hashed := sha256.Sum256([]byte(message))
	return rsa.VerifyPKCS1v15(publicKey, crypto.SHA256, hashed[:], signature)
}

// wechatNativePlatformCertSerial 返回平台证书序列号（大写十六进制，用于与回调头比对）。
func wechatNativePlatformCertSerial(cert *x509.Certificate) string {
	return strings.ToUpper(cert.SerialNumber.Text(16))
}

// wechatNativeDecrypt 使用 APIv3 密钥对回调 resource 做 AES-256-GCM 解密。
func wechatNativeDecrypt(apiV3Key string, ciphertextB64 string, nonce string, associatedData string) ([]byte, error) {
	key := []byte(apiV3Key)
	if len(key) != 32 {
		return nil, errors.New("APIv3 密钥长度必须为 32 字节")
	}
	ciphertext, err := base64.StdEncoding.DecodeString(ciphertextB64)
	if err != nil {
		return nil, err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	if len(nonce) != gcm.NonceSize() {
		return nil, errors.New("回调 nonce 长度非法")
	}
	return gcm.Open(nil, []byte(nonce), ciphertext, []byte(associatedData))
}

// buildWechatNativeAuthHeader 构造微信支付 V3 请求的 Authorization 头。
func buildWechatNativeAuthHeader(mchId string, serialNo string, privateKeyPem string, method string, canonicalURL string, body string) (string, error) {
	privateKey, err := loadWechatNativePrivateKey(privateKeyPem)
	if err != nil {
		return "", err
	}
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	nonce := common.GetRandomString(32)
	message := method + "\n" + canonicalURL + "\n" + timestamp + "\n" + nonce + "\n" + body + "\n"
	signature, err := wechatNativeSign(privateKey, message)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf(
		`WECHATPAY2-SHA256-RSA2048 mchid="%s",nonce_str="%s",signature="%s",timestamp="%s",serial_no="%s"`,
		mchId, nonce, signature, timestamp, serialNo,
	), nil
}

// RequestWechatNativePay 微信支付 Native 下单，返回 code_url 供前端生成二维码。
func RequestWechatNativePay(c *gin.Context) {
	var req WechatNativePayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	if req.PaymentMethod != model.PaymentMethodWechatNative {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "不支持的支付渠道"})
		return
	}
	if float64(req.Amount) < getWechatNativeMinTopup() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %v", getWechatNativeMinTopup())})
		return
	}
	id := c.GetInt("id")
	if rejectInvalidTopUpQuota(c, id, req.Amount) {
		return
	}
	group, err := model.GetUserGroup(id, true)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取用户分组失败"})
		return
	}
	payMoney := getPayMoney(req.Amount, group)
	if payMoney < 0.01 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值金额过低"})
		return
	}

	// 微信支付以「分」为单位，最小 1 分；使用十进制避免浮点误差。
	totalFen := decimal.NewFromFloat(payMoney).Mul(decimal.NewFromInt(100)).Round(0)
	if totalFen.LessThanOrEqual(decimal.Zero) {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值金额过低"})
		return
	}
	total := totalFen.IntPart()

	callBackAddress := service.GetCallbackAddress()
	notifyUrl := callBackAddress + "/api/user/wechat-native/notify"
	tradeNo := fmt.Sprintf("WX%d%s", id, common.GetRandomString(16))

	orderReq := wechatNativeCreateOrderRequest{
		AppId:       setting.WechatNativeAppId,
		MchId:       setting.WechatNativeMchId,
		Description: "账户充值",
		OutTradeNo:  tradeNo,
		NotifyUrl:   notifyUrl,
		Amount: wechatNativeAmount{
			Total:    total,
			Currency: "CNY",
		},
	}
	bodyBytes, err := common.Marshal(orderReq)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 构造下单请求失败 user_id=%d trade_no=%s error=%q", id, tradeNo, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("构造请求失败：%s", err.Error())})
		return
	}
	body := string(bodyBytes)

	const canonicalURL = "/v3/pay/transactions/native"
	authHeader, err := buildWechatNativeAuthHeader(
		setting.WechatNativeMchId,
		setting.WechatNativeMchSerialNo,
		setting.WechatNativePrivateKey,
		http.MethodPost,
		canonicalURL,
		body,
	)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 签名失败 user_id=%d trade_no=%s error=%q", id, tradeNo, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("签名失败：%s（请检查商户私钥格式与商户证书序列号）", err.Error())})
		return
	}

	httpReq, err := http.NewRequest(http.MethodPost, wechatNativeApiHost+canonicalURL, strings.NewReader(body))
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 构造请求失败 user_id=%d trade_no=%s error=%q", id, tradeNo, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("构造 HTTP 请求失败：%s", err.Error())})
		return
	}
	httpReq.Header.Set("Authorization", authHeader)
	httpReq.Header.Set("Accept", "application/json")
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("User-Agent", "new-api")

	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 下单请求失败 user_id=%d trade_no=%s error=%q", id, tradeNo, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("请求微信支付服务器失败：%s", err.Error())})
		return
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 下单失败 user_id=%d trade_no=%s status=%d body=%s", id, tradeNo, resp.StatusCode, string(respBody)))
		errMsg := parseWechatPayError(respBody)
		if errMsg == "" {
			errMsg = fmt.Sprintf("微信支付返回 HTTP %d", resp.StatusCode)
		}
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": errMsg})
		return
	}

	var orderResp wechatNativeCreateOrderResponse
	if err := common.Unmarshal(respBody, &orderResp); err != nil || orderResp.CodeUrl == "" {
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 解析下单响应失败 user_id=%d trade_no=%s body=%s error=%q", id, tradeNo, string(respBody), err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("解析微信支付响应失败：%s", err.Error())})
		return
	}

	amount := req.Amount
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		dAmount := decimal.NewFromFloat(amount)
		dQuotaPerUnit := decimal.NewFromFloat(common.QuotaPerUnit)
		amount = dAmount.Div(dQuotaPerUnit).InexactFloat64()
	}
	topUp := &model.TopUp{
		UserId:          id,
		Amount:          amount,
		Money:           payMoney,
		TradeNo:         tradeNo,
		PaymentMethod:   model.PaymentMethodWechatNative,
		PaymentProvider: model.PaymentProviderWechatNative,
		CreateTime:      time.Now().Unix(),
		Status:          common.TopUpStatusPending,
	}
	if err := topUp.Insert(); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("微信支付 创建充值订单失败 user_id=%d trade_no=%s amount=%v error=%q", id, tradeNo, req.Amount, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}
	logger.LogInfo(c.Request.Context(), fmt.Sprintf("微信支付 充值订单创建成功 user_id=%d trade_no=%s amount=%v money=%.2f", id, tradeNo, req.Amount, payMoney))
	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"code_url": orderResp.CodeUrl,
			"trade_no": tradeNo,
		},
	})
}

// WechatNativeNotify 微信支付 Native 回调：验签 -> 解密 -> 入账。
func WechatNativeNotify(c *gin.Context) {
	ctx := c.Request.Context()
	if !isWechatNativeWebhookEnabled() {
		logger.LogWarn(ctx, fmt.Sprintf("微信支付 webhook 被拒绝 reason=webhook_disabled path=%q client_ip=%s", c.Request.RequestURI, c.ClientIP()))
		c.JSON(http.StatusForbidden, gin.H{"code": "FAIL", "message": "disabled"})
		return
	}

	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		logger.LogError(ctx, fmt.Sprintf("微信支付 webhook 读取请求体失败 path=%q client_ip=%s error=%q", c.Request.RequestURI, c.ClientIP(), err.Error()))
		c.JSON(http.StatusBadRequest, gin.H{"code": "FAIL", "message": "read body failed"})
		return
	}

	timestamp := c.GetHeader("Wechatpay-Timestamp")
	nonce := c.GetHeader("Wechatpay-Nonce")
	signature := c.GetHeader("Wechatpay-Signature")
	serial := c.GetHeader("Wechatpay-Serial")

	platformCert, err := loadWechatNativePlatformCert(setting.WechatNativePlatformCert)
	if err != nil {
		logger.LogError(ctx, fmt.Sprintf("微信支付 平台证书解析失败 client_ip=%s error=%q", c.ClientIP(), err.Error()))
		c.JSON(http.StatusInternalServerError, gin.H{"code": "FAIL", "message": "cert parse failed"})
		return
	}
	if serial != "" && serial != wechatNativePlatformCertSerial(platformCert) {
		logger.LogWarn(ctx, fmt.Sprintf("微信支付 回调证书序列号不匹配 client_ip=%s serial=%s", c.ClientIP(), serial))
		c.JSON(http.StatusBadRequest, gin.H{"code": "FAIL", "message": "serial mismatch"})
		return
	}

	message := timestamp + "\n" + nonce + "\n" + string(payload) + "\n"
	if err := wechatNativeVerify(platformCert, message, signature); err != nil {
		logger.LogWarn(ctx, fmt.Sprintf("微信支付 回调验签失败 client_ip=%s error=%q", c.ClientIP(), err.Error()))
		c.JSON(http.StatusBadRequest, gin.H{"code": "FAIL", "message": "verify failed"})
		return
	}

	var notify wechatNativeNotifyBody
	if err := common.Unmarshal(payload, &notify); err != nil {
		logger.LogWarn(ctx, fmt.Sprintf("微信支付 回调解析失败 client_ip=%s error=%q", c.ClientIP(), err.Error()))
		c.JSON(http.StatusBadRequest, gin.H{"code": "FAIL", "message": "parse failed"})
		return
	}

	if notify.EventType != "TRANSACTION.SUCCESS" {
		logger.LogInfo(ctx, fmt.Sprintf("微信支付 忽略事件 event_type=%s client_ip=%s", notify.EventType, c.ClientIP()))
		c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "message": "成功"})
		return
	}

	plaintext, err := wechatNativeDecrypt(
		setting.WechatNativeApiV3Key,
		notify.Resource.Ciphertext,
		notify.Resource.Nonce,
		notify.Resource.AssociatedData,
	)
	if err != nil {
		logger.LogError(ctx, fmt.Sprintf("微信支付 回调解密失败 client_ip=%s error=%q", c.ClientIP(), err.Error()))
		c.JSON(http.StatusBadRequest, gin.H{"code": "FAIL", "message": "decrypt failed"})
		return
	}

	var transaction wechatNativeTransaction
	if err := common.Unmarshal(plaintext, &transaction); err != nil || transaction.OutTradeNo == "" {
		logger.LogWarn(ctx, fmt.Sprintf("微信支付 回调交易解析失败 client_ip=%s error=%q", c.ClientIP(), err.Error()))
		c.JSON(http.StatusBadRequest, gin.H{"code": "FAIL", "message": "transaction parse failed"})
		return
	}

	if transaction.TradeState != "SUCCESS" {
		logger.LogInfo(ctx, fmt.Sprintf("微信支付 交易状态非成功 trade_no=%s trade_state=%s client_ip=%s", transaction.OutTradeNo, transaction.TradeState, c.ClientIP()))
		c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "message": "成功"})
		return
	}

	LockOrder(transaction.OutTradeNo)
	defer UnlockOrder(transaction.OutTradeNo)

	if err := model.RechargeWechatNative(transaction.OutTradeNo, c.ClientIP()); err != nil {
		logger.LogError(ctx, fmt.Sprintf("微信支付 充值处理失败 trade_no=%s client_ip=%s error=%q", transaction.OutTradeNo, c.ClientIP(), err.Error()))
		c.JSON(http.StatusInternalServerError, gin.H{"code": "FAIL", "message": "recharge failed"})
		return
	}
	logger.LogInfo(ctx, fmt.Sprintf("微信支付 充值成功 trade_no=%s client_ip=%s", transaction.OutTradeNo, c.ClientIP()))
	c.JSON(http.StatusOK, gin.H{"code": "SUCCESS", "message": "成功"})
}
