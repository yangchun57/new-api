package controller

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/base64"
	"encoding/pem"
	"math/big"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func generateTestRSAKey(t *testing.T) *rsa.PrivateKey {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)
	return key
}

func encodePKCS8PrivateKey(t *testing.T, key *rsa.PrivateKey) string {
	t.Helper()
	der, err := x509.MarshalPKCS8PrivateKey(key)
	require.NoError(t, err)
	return string(pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: der}))
}

func encodePKCS1PrivateKey(t *testing.T, key *rsa.PrivateKey) string {
	t.Helper()
	return string(pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(key),
	}))
}

func generateSelfSignedCert(t *testing.T, key *rsa.PrivateKey) *x509.Certificate {
	t.Helper()
	template := &x509.Certificate{
		SerialNumber:          big.NewInt(123456),
		Subject:               pkix.Name{CommonName: "wechatpay"},
		NotBefore:             time.Now().Add(-time.Hour),
		NotAfter:              time.Now().Add(time.Hour),
		KeyUsage:              x509.KeyUsageDigitalSignature,
		BasicConstraintsValid: true,
	}
	der, err := x509.CreateCertificate(rand.Reader, template, template, &key.PublicKey, key)
	require.NoError(t, err)
	cert, err := x509.ParseCertificate(der)
	require.NoError(t, err)
	return cert
}

func TestLoadWechatNativePrivateKey(t *testing.T) {
	key := generateTestRSAKey(t)

	t.Run("PKCS8", func(t *testing.T) {
		parsed, err := loadWechatNativePrivateKey(encodePKCS8PrivateKey(t, key))
		require.NoError(t, err)
		assert.Equal(t, key.PublicKey, parsed.PublicKey)
	})

	t.Run("PKCS1", func(t *testing.T) {
		parsed, err := loadWechatNativePrivateKey(encodePKCS1PrivateKey(t, key))
		require.NoError(t, err)
		assert.Equal(t, key.PublicKey, parsed.PublicKey)
	})

	t.Run("invalid", func(t *testing.T) {
		_, err := loadWechatNativePrivateKey("not a pem")
		require.Error(t, err)
	})
}

func TestWechatNativeSignAndVerify(t *testing.T) {
	key := generateTestRSAKey(t)
	cert := generateSelfSignedCert(t, key)

	message := "POST\n/v3/pay/transactions/native\n1700000000\nnonce\nbody\n"
	signature, err := wechatNativeSign(key, message)
	require.NoError(t, err)

	require.NoError(t, wechatNativeVerify(cert, message, signature))

	tampered := message[:len(message)-2] + "x!"
	require.Error(t, wechatNativeVerify(cert, tampered, signature))
}

func TestWechatNativeDecrypt(t *testing.T) {
	apiV3Key := "0123456789abcdef0123456789abcdef"
	plaintext := []byte(`{"out_trade_no":"WX123","trade_state":"SUCCESS"}`)

	block, err := aes.NewCipher([]byte(apiV3Key))
	require.NoError(t, err)
	gcm, err := cipher.NewGCM(block)
	require.NoError(t, err)

	nonce := make([]byte, gcm.NonceSize())
	_, err = rand.Read(nonce)
	require.NoError(t, err)
	associatedData := "transaction"
	ciphertext := gcm.Seal(nil, nonce, plaintext, []byte(associatedData))

	decrypted, err := wechatNativeDecrypt(
		apiV3Key,
		base64.StdEncoding.EncodeToString(ciphertext),
		string(nonce),
		associatedData,
	)
	require.NoError(t, err)
	assert.Equal(t, plaintext, decrypted)

	_, err = wechatNativeDecrypt(
		apiV3Key,
		base64.StdEncoding.EncodeToString(ciphertext),
		string(nonce),
		"tampered",
	)
	require.Error(t, err)
}

func TestWechatNativePlatformCertSerial(t *testing.T) {
	key := generateTestRSAKey(t)
	cert := generateSelfSignedCert(t, key)
	serial := wechatNativePlatformCertSerial(cert)
	assert.NotEmpty(t, serial)
	assert.Equal(t, strings.ToUpper(cert.SerialNumber.Text(16)), serial, "serial should be upper-cased hex of the certificate serial")
}
