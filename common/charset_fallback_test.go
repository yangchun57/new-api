package common

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"unicode/utf8"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
)

func withCharsetFallback(t *testing.T, charset string) {
	t.Helper()
	prevEnabled := RequestCharsetFallbackEnabled
	prevCharset := RequestCharsetFallbackCharset
	RequestCharsetFallbackEnabled = true
	RequestCharsetFallbackCharset = charset
	t.Cleanup(func() {
		RequestCharsetFallbackEnabled = prevEnabled
		RequestCharsetFallbackCharset = prevCharset
	})
}

func encodeGB18030(t *testing.T, text string) []byte {
	t.Helper()
	encoded, _, err := transform.Bytes(simplifiedchinese.GB18030.NewEncoder(), []byte(text))
	require.NoError(t, err)
	return encoded
}

func TestTranscodeLegacyJSONBody_GB18030RoundTrip(t *testing.T) {
	withCharsetFallback(t, "gb18030")
	original := `{"messages":[{"role":"user","content":"网卡MAC地址"}]}`
	encoded := encodeGB18030(t, original)
	require.False(t, utf8.Valid(encoded), "GBK body must not be valid UTF-8 for this test")
	require.True(t, looksLikeLegacyEncoding(encoded))

	got, ok := transcodeLegacyJSONBody(encoded)

	require.True(t, ok)
	assert.Equal(t, original, string(got))
}

func TestTranscodeLegacyJSONBody_LeavesValidUTF8Untouched(t *testing.T) {
	withCharsetFallback(t, "gb18030")
	body := []byte(`{"content":"中文内容"}`)

	got, ok := transcodeLegacyJSONBody(body)

	assert.False(t, ok)
	assert.Equal(t, body, got)
}

func TestTranscodeLegacyJSONBody_DisabledReturnsInput(t *testing.T) {
	encoded := encodeGB18030(t, `{"content":"中文"}`)
	prevEnabled := RequestCharsetFallbackEnabled
	RequestCharsetFallbackEnabled = false
	t.Cleanup(func() { RequestCharsetFallbackEnabled = prevEnabled })

	got, ok := transcodeLegacyJSONBody(encoded)

	assert.False(t, ok)
	assert.Equal(t, encoded, got)
}

func TestTranscodeLegacyJSONBody_KeepsUTF8WithStrayByte(t *testing.T) {
	withCharsetFallback(t, "gb18030")
	body := []byte("{\"content\":\"中文ab\xff\"}")
	require.False(t, utf8.Valid(body))
	require.False(t, looksLikeLegacyEncoding(body))

	got, ok := transcodeLegacyJSONBody(body)

	assert.False(t, ok)
	assert.Equal(t, body, got)
}

func TestCharsetFallbackDiagnosis_ReportsSampleAndFirstInvalidByte(t *testing.T) {
	withCharsetFallback(t, "gb18030")
	encoded := encodeGB18030(t, `{"content":"中文"}`)
	_, _, firstInvalid := utf8ByteStats(encoded)
	require.GreaterOrEqual(t, firstInvalid, 0)

	diagnosis := charsetFallbackDiagnosis(encoded, true)

	assert.Contains(t, diagnosis, "reason=converted")
	assert.Contains(t, diagnosis, "charset=gb18030")
	assert.Contains(t, diagnosis, fmt.Sprintf("bytes=%d", len(encoded)))
	assert.Contains(t, diagnosis, fmt.Sprintf("first_invalid=%d", firstInvalid))
	assert.Contains(t, diagnosis, fmt.Sprintf("sample=%02X", encoded[firstInvalid]))
}

func TestCharsetFallbackDiagnosis_ReportsKeptAsIs(t *testing.T) {
	withCharsetFallback(t, "gb18030")
	body := []byte("{\"content\":\"中文ab\xff\"}")
	_, _, firstInvalid := utf8ByteStats(body)
	require.Equal(t, len(body)-3, firstInvalid)

	diagnosis := charsetFallbackDiagnosis(body, false)

	assert.Contains(t, diagnosis, "reason=kept-as-is")
	assert.Contains(t, diagnosis, fmt.Sprintf("first_invalid=%d", firstInvalid))
	assert.Contains(t, diagnosis, "sample=FF")
}

func TestTranscodeRequestBody_ReplacesJSONStorage(t *testing.T) {
	withCharsetFallback(t, "gb18030")
	original := `{"content":"中文内容"}`
	storage, err := CreateBodyStorage(encodeGB18030(t, original))
	require.NoError(t, err)

	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)
	c.Request.Header.Set("Content-Type", "application/json")

	replaced := transcodeRequestBody(c, storage)
	t.Cleanup(func() { _ = replaced.Close() })

	got, err := replaced.Bytes()
	require.NoError(t, err)
	assert.Equal(t, original, string(got))
}

func TestTranscodeRequestBody_IgnoresNonJSONContentType(t *testing.T) {
	withCharsetFallback(t, "gb18030")
	encoded := encodeGB18030(t, `{"content":"中文"}`)
	storage, err := CreateBodyStorage(encoded)
	require.NoError(t, err)
	t.Cleanup(func() { _ = storage.Close() })

	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	c.Request = httptest.NewRequest(http.MethodPost, "/v1/files", nil)
	c.Request.Header.Set("Content-Type", "multipart/form-data; boundary=x")

	got := transcodeRequestBody(c, storage)

	assert.Equal(t, storage, got)
}
