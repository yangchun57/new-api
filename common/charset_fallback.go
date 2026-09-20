package common

import (
	"fmt"
	"strings"
	"unicode/utf8"

	"golang.org/x/text/encoding"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/encoding/traditionalchinese"
	"golang.org/x/text/transform"

	"github.com/gin-gonic/gin"
)

// charsetFallbackSampleBytes 诊断日志中十六进制采样的最大字节数。
const charsetFallbackSampleBytes = 64

// legacyCharsetEncoding 返回旧编码名称对应的解码器。空值默认为 GB18030。
func legacyCharsetEncoding(name string) (encoding.Encoding, bool) {
	switch strings.ToLower(strings.TrimSpace(name)) {
	case "", "gb18030":
		return simplifiedchinese.GB18030, true
	case "gbk", "gb2312", "cp936":
		return simplifiedchinese.GBK, true
	case "big5", "big-5", "cp950":
		return traditionalchinese.Big5, true
	}
	return nil, false
}

// utf8ByteStats 统计正文中无法按 UTF-8 解码的字节数、可正常解码的多字节字符所占字节数，
// 以及第一个非法字节的下标（全部合法时为 -1）。
func utf8ByteStats(body []byte) (invalid int, validMultibyte int, firstInvalid int) {
	firstInvalid = -1
	for i := 0; i < len(body); {
		r, size := utf8.DecodeRune(body[i:])
		if r == utf8.RuneError && size == 1 {
			if firstInvalid < 0 {
				firstInvalid = i
			}
			invalid++
			i++
			continue
		}
		if size > 1 {
			validMultibyte += size
		}
		i += size
	}
	return invalid, validMultibyte, firstInvalid
}

// looksLikeLegacyEncoding 判断一段非 UTF-8 字节是否整体属于旧编码。
// 只有当无法按 UTF-8 解码的字节数超过可正常解码的多字节字符所占字节数时才成立，
// 这样即使请求体只是个别坏字节的 UTF-8 文本也不会被整体转码破坏。
func looksLikeLegacyEncoding(body []byte) bool {
	invalid, validMultibyte, _ := utf8ByteStats(body)
	return invalid > validMultibyte
}

// transcodeLegacyJSONBody 在开关开启时，把以旧编码（GBK/GB18030/Big5）发送的
// JSON 请求体整体转码为 UTF-8，避免中文在 JSON 解析阶段被替换成 U+FFFD。
// 已经是合法 UTF-8 的正文原样返回，第二个返回值表示是否发生了转码。
func transcodeLegacyJSONBody(body []byte) ([]byte, bool) {
	if !RequestCharsetFallbackEnabled || len(body) == 0 {
		return body, false
	}
	if utf8.Valid(body) || !looksLikeLegacyEncoding(body) {
		return body, false
	}
	enc, ok := legacyCharsetEncoding(RequestCharsetFallbackCharset)
	if !ok {
		SysError("unknown REQUEST_CHARSET_FALLBACK_CHARSET: " + RequestCharsetFallbackCharset)
		return body, false
	}
	decoded, _, err := transform.Bytes(enc.NewDecoder(), body)
	if err != nil {
		SysError("failed to transcode request body from " + RequestCharsetFallbackCharset + ": " + err.Error())
		return body, false
	}
	return decoded, true
}

// charsetFallbackDiagnosis 汇总非 UTF-8 正文的诊断信息。
// sample 是第一个非法字节起的一段十六进制，用于事后判断客户端实际使用的编码。
func charsetFallbackDiagnosis(body []byte, converted bool) string {
	invalid, validMultibyte, firstInvalid := utf8ByteStats(body)
	reason := "kept-as-is"
	if converted {
		reason = "converted"
	}
	sample := ""
	if firstInvalid >= 0 {
		end := firstInvalid + charsetFallbackSampleBytes
		if end > len(body) {
			end = len(body)
		}
		sample = fmt.Sprintf("%X", body[firstInvalid:end])
	}
	return fmt.Sprintf("reason=%s charset=%s bytes=%d invalid=%d valid_multibyte=%d first_invalid=%d sample=%s",
		reason, RequestCharsetFallbackCharset, len(body), invalid, validMultibyte, firstInvalid, sample)
}

func charsetFallbackRequestContext(c *gin.Context) string {
	return fmt.Sprintf("request_id=%s method=%s path=%s ua=%q",
		c.GetString(RequestIdKey), c.Request.Method, c.Request.URL.Path, c.Request.UserAgent())
}

// transcodeRequestBody 在开关开启且请求体为 JSON 时，检测并转码旧编码正文。
// 未发生转码时原样返回原存储；发生转码时返回新的存储并释放原存储。
// 必须在存储对象被缓存或复用之前调用。
//
// 只要 JSON 正文不是合法 UTF-8（无论最终是否转码成功）都会打印诊断日志，
// 便于在正文仍然乱码时确认客户端实际使用的编码。
func transcodeRequestBody(c *gin.Context, storage BodyStorage) BodyStorage {
	if !RequestCharsetFallbackEnabled {
		return storage
	}
	if !strings.HasPrefix(c.Request.Header.Get("Content-Type"), "application/json") {
		return storage
	}
	data, err := storage.Bytes()
	if err != nil {
		return storage
	}
	if utf8.Valid(data) {
		return storage
	}

	converted, ok := transcodeLegacyJSONBody(data)
	diagnosis := charsetFallbackDiagnosis(data, ok) + " " + charsetFallbackRequestContext(c)
	if !ok {
		SysError("charset fallback kept non-UTF-8 request body unchanged, stored text may stay garbled: " + diagnosis)
		return storage
	}
	newStorage, err := CreateBodyStorage(converted)
	if err != nil {
		SysError("charset fallback failed to rebuild request body storage: " + err.Error() + " " + diagnosis)
		return storage
	}
	if err := storage.Close(); err != nil {
		SysError("charset fallback failed to release original request body storage: " + err.Error())
	}
	SysLog("charset fallback transcoded non-UTF-8 request body to UTF-8: " + diagnosis)
	return newStorage
}
