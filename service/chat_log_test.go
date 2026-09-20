package service

import (
	"encoding/json"
	"testing"
	"unicode/utf8"

	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestExtractChatLogMessages_OpenAI(t *testing.T) {
	req := &dto.GeneralOpenAIRequest{
		Messages: []dto.Message{
			{Role: "system", Content: "you are helpful"},
			{Role: "user", Content: "hello"},
		},
	}

	got := extractChatLogMessages(req)

	require.Len(t, got, 2)
	assert.Equal(t, "system", got[0].Role)
	assert.Equal(t, "you are helpful", got[0].Content)
	assert.Equal(t, "user", got[1].Role)
	assert.Equal(t, "hello", got[1].Content)
}

func TestExtractChatLogMessages_OpenAI_SkipsEmpty(t *testing.T) {
	req := &dto.GeneralOpenAIRequest{
		Messages: []dto.Message{
			{Role: "user", Content: "hi"},
			{Role: "assistant", Content: ""},
		},
	}

	got := extractChatLogMessages(req)

	require.Len(t, got, 1)
	assert.Equal(t, "hi", got[0].Content)
}

func TestExtractChatLogMessages_Claude(t *testing.T) {
	req := &dto.ClaudeRequest{}
	req.SetStringSystem("be concise")
	req.Messages = []dto.ClaudeMessage{
		{Role: "user", Content: "hello"},
	}

	got := extractChatLogMessages(req)

	require.Len(t, got, 2)
	assert.Equal(t, "system", got[0].Role)
	assert.Equal(t, "be concise", got[0].Content)
	assert.Equal(t, "user", got[1].Role)
	assert.Equal(t, "hello", got[1].Content)
}

func TestExtractChatLogMessages_Gemini(t *testing.T) {
	req := &dto.GeminiChatRequest{
		Contents: []dto.GeminiChatContent{
			{Role: "user", Parts: []dto.GeminiPart{{Text: "hello"}}},
		},
	}

	got := extractChatLogMessages(req)

	require.Len(t, got, 1)
	assert.Equal(t, "user", got[0].Role)
	assert.Equal(t, "hello", got[0].Content)
}

func TestExtractChatLogReply_OpenAIText(t *testing.T) {
	body := []byte(`{"choices":[{"message":{"content":"hi there"}}]}`)

	got := extractNonStreamReply(types.RelayFormatOpenAI, body)

	assert.Equal(t, "hi there", got)
}

func TestExtractChatLogReply_Claude(t *testing.T) {
	body := []byte(`{"content":[{"type":"text","text":"hello"},{"type":"text","text":" world"}]}`)

	got := extractNonStreamReply(types.RelayFormatClaude, body)

	assert.Equal(t, "hello world", got)
}

func TestExtractChatLogReply_Gemini(t *testing.T) {
	body := []byte(`{"candidates":[{"content":{"parts":[{"text":"bonjour"}]}}]}`)

	got := extractNonStreamReply(types.RelayFormatGemini, body)

	assert.Equal(t, "bonjour", got)
}

func TestExtractChatLogReply_Responses(t *testing.T) {
	body := []byte(`{"output":[{"type":"message","content":[{"type":"output_text","text":"hi"},{"type":"output_text","text":" there"}]}]}`)

	got := extractNonStreamReply(types.RelayFormatOpenAIResponses, body)

	assert.Equal(t, "hi there", got)
}

func TestExtractChatLogReply_OpenAIStream(t *testing.T) {
	body := []byte("data: {\"choices\":[{\"delta\":{\"content\":\"hello\"}}]}\n\ndata: {\"choices\":[{\"delta\":{\"content\":\" world\"}}]}\n\ndata: [DONE]\n\n")

	got := extractStreamReply(types.RelayFormatOpenAI, body)

	assert.Equal(t, "hello world", got)
}

func TestExtractChatLogReply_ClaudeStream(t *testing.T) {
	body := []byte("event: content_block_delta\ndata: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\"hello\"}}\n\nevent: content_block_delta\ndata: {\"type\":\"content_block_delta\",\"delta\":{\"type\":\"text_delta\",\"text\":\" world\"}}\n\n")

	got := extractStreamReply(types.RelayFormatClaude, body)

	assert.Equal(t, "hello world", got)
}

func TestExtractChatLogReply_GeminiStream(t *testing.T) {
	body := []byte("data: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"hey\"}]}}]}\n\ndata: {\"candidates\":[{\"content\":{\"parts\":[{\"text\":\" you\"}]}}]}\n\n")

	got := extractStreamReply(types.RelayFormatGemini, body)

	assert.Equal(t, "hey you", got)
}

func TestExtractChatLogReply_ResponsesStream(t *testing.T) {
	body := []byte("data: {\"type\":\"response.output_text.delta\",\"delta\":\"hello\"}\n\ndata: {\"type\":\"response.output_text.delta\",\"delta\":\" world\"}\n\n")

	got := extractStreamReply(types.RelayFormatOpenAIResponses, body)

	assert.Equal(t, "hello world", got)
}

func TestExtractChatLogReply_Stream_RejectsNonDataLines(t *testing.T) {
	body := []byte(": PING\n\ndata: {\"choices\":[{\"delta\":{\"content\":\"ok\"}}]}\n\n")

	got := extractStreamReply(types.RelayFormatOpenAI, body)

	assert.Equal(t, "ok", got)
}

func TestChatLogCapture_TruncatesAtRuneBoundary(t *testing.T) {
	capture := &ChatLogCapture{maxBytes: 4}

	capture.append([]byte("ab中"))

	assert.True(t, utf8.Valid(capture.Bytes()))
	assert.Equal(t, "ab", string(capture.Bytes()))
}

func TestChatLogCapture_KeepsContentThatFits(t *testing.T) {
	capture := &ChatLogCapture{maxBytes: 10}

	capture.append([]byte("ab\xe4"))
	capture.append([]byte("\xb8\xadcd"))

	assert.Equal(t, "ab中cd", string(capture.Bytes()))
}

func TestExtractChatLogMessages_Responses(t *testing.T) {
	input := json.RawMessage(`[
		{"type":"message","role":"user","content":[{"type":"input_text","text":"question"}]}
	]`)
	req := &dto.OpenAIResponsesRequest{Input: input}

	got := extractChatLogMessages(req)

	require.Len(t, got, 1)
	assert.Equal(t, "user", got[0].Role)
	assert.Equal(t, "question", got[0].Content)
}
