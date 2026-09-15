package service

import (
	"bytes"
	"strings"
	"sync"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/relaykit/dto"
	"github.com/QuantumNous/new-api/relaykit/types"

	"github.com/gin-gonic/gin"
	"github.com/tidwall/gjson"
)

const chatLogConversationIdHeader = "X-Conversation-Id"

func shouldCaptureChatLog(format types.RelayFormat) bool {
	switch format {
	case types.RelayFormatOpenAI, types.RelayFormatClaude, types.RelayFormatGemini, types.RelayFormatOpenAIResponses:
		return true
	}
	return false
}

// ChatLogCapture 包裹 gin.ResponseWriter，旁路捕获返回给客户端的正文字节。
type ChatLogCapture struct {
	gin.ResponseWriter
	mu       sync.Mutex
	buf      bytes.Buffer
	maxBytes int
}

func (w *ChatLogCapture) append(p []byte) {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.buf.Len() >= w.maxBytes {
		return
	}
	remaining := w.maxBytes - w.buf.Len()
	if len(p) > remaining {
		w.buf.Write(p[:remaining])
	} else {
		w.buf.Write(p)
	}
}

func (w *ChatLogCapture) Write(p []byte) (int, error) {
	w.append(p)
	return w.ResponseWriter.Write(p)
}

func (w *ChatLogCapture) WriteString(s string) (int, error) {
	w.append([]byte(s))
	return w.ResponseWriter.WriteString(s)
}

// Reset 在每次 relay 重试前清空已捕获内容，确保只保留最终成功响应的正文。
func (w *ChatLogCapture) Reset() {
	w.mu.Lock()
	defer w.mu.Unlock()
	w.buf.Reset()
}

func (w *ChatLogCapture) Bytes() []byte {
	w.mu.Lock()
	defer w.mu.Unlock()
	out := make([]byte, w.buf.Len())
	copy(out, w.buf.Bytes())
	return out
}

// StartChatLogCapture 在 relay 入口包裹响应写入器，用于旁路捕获正文。
// 未启用或非对话类请求时返回 nil。
func StartChatLogCapture(c *gin.Context, info *relaycommon.RelayInfo) *ChatLogCapture {
	if !common.ChatLogEnabled || info == nil || !shouldCaptureChatLog(info.RelayFormat) {
		return nil
	}
	maxBytes := common.ChatLogMaxBodyKB * 1024
	if maxBytes <= 0 {
		maxBytes = 64 * 1024
	}
	capture := &ChatLogCapture{
		ResponseWriter: c.Writer,
		maxBytes:       maxBytes,
	}
	c.Writer = capture
	return capture
}

// FinishChatLogCapture 解析请求消息与响应正文，异步写入 chat_logs。
func FinishChatLogCapture(c *gin.Context, info *relaycommon.RelayInfo, capture *ChatLogCapture, status int) {
	if capture == nil || !common.ChatLogEnabled || info == nil {
		return
	}
	messages := extractChatLogMessages(info.Request)
	reply := extractChatLogReply(info.RelayFormat, info.IsStream, capture.Bytes())
	rows := buildChatLogRows(c, info, messages, reply, status)
	model.RecordChatLogs(rows)
}

type chatLogMessage struct {
	Role        string
	Content     string
	Attachments []chatLogAttachment
}

// chatLogAttachment 描述会话消息中的附件（图片/文件/音频/视频）。
// Url 可能是外链、data URL（base64）或 file_id。
type chatLogAttachment struct {
	Type     string `json:"type"`
	Url      string `json:"url,omitempty"`
	MimeType string `json:"mime_type,omitempty"`
	FileName string `json:"file_name,omitempty"`
}

func attachmentTypeFromMime(mime string) string {
	switch {
	case strings.HasPrefix(mime, "image/"):
		return "image"
	case strings.HasPrefix(mime, "audio/"):
		return "audio"
	case strings.HasPrefix(mime, "video/"):
		return "video"
	default:
		return "file"
	}
}

func openAIMessageAttachments(m *dto.Message) []chatLogAttachment {
	var attachments []chatLogAttachment
	for _, mc := range m.ParseContent() {
		switch mc.Type {
		case dto.ContentTypeImageURL:
			if img := mc.GetImageMedia(); img != nil && img.Url != "" {
				attachments = append(attachments, chatLogAttachment{Type: "image", Url: img.Url, MimeType: img.MimeType})
			}
		case dto.ContentTypeInputAudio:
			if audio := mc.GetInputAudio(); audio != nil && audio.Data != "" {
				attachment := chatLogAttachment{Type: "audio"}
				if audio.Format != "" {
					attachment.MimeType = "audio/" + audio.Format
					attachment.Url = "data:" + attachment.MimeType + ";base64," + audio.Data
				} else {
					attachment.Url = audio.Data
				}
				attachments = append(attachments, attachment)
			}
		case dto.ContentTypeFile:
			if file := mc.GetFile(); file != nil {
				attachment := chatLogAttachment{Type: "file", FileName: file.FileName}
				if file.FileData != "" {
					attachment.Url = "data:;base64," + file.FileData
				} else {
					attachment.Url = file.FileId
				}
				if attachment.Url != "" || attachment.FileName != "" {
					attachments = append(attachments, attachment)
				}
			}
		case dto.ContentTypeVideoUrl:
			if video := mc.GetVideoUrl(); video != nil && video.Url != "" {
				attachments = append(attachments, chatLogAttachment{Type: "video", Url: video.Url})
			}
		}
	}
	return attachments
}

func claudeMessageAttachments(m *dto.ClaudeMessage) []chatLogAttachment {
	var attachments []chatLogAttachment
	parts, err := m.ParseContent()
	if err != nil {
		return attachments
	}
	for _, part := range parts {
		if part.Type != "image" && part.Type != "document" {
			continue
		}
		if part.Source == nil {
			continue
		}
		url := part.Source.Url
		mime := part.Source.MediaType
		if url == "" {
			data, ok := part.Source.Data.(string)
			if !ok || data == "" {
				continue
			}
			if mime != "" {
				url = "data:" + mime + ";base64," + data
			} else {
				url = "data:;base64," + data
			}
		}
		attachments = append(attachments, chatLogAttachment{Type: part.Type, Url: url, MimeType: mime})
	}
	return attachments
}

func geminiMessageAttachments(parts []dto.GeminiPart) []chatLogAttachment {
	var attachments []chatLogAttachment
	for _, part := range parts {
		if part.InlineData != nil && part.InlineData.Data != "" {
			mime := part.InlineData.MimeType
			attachment := chatLogAttachment{Type: attachmentTypeFromMime(mime), MimeType: mime}
			if mime != "" {
				attachment.Url = "data:" + mime + ";base64," + part.InlineData.Data
			} else {
				attachment.Url = "data:;base64," + part.InlineData.Data
			}
			attachments = append(attachments, attachment)
		}
		if part.FileData != nil && part.FileData.FileUri != "" {
			attachments = append(attachments, chatLogAttachment{Type: "file", Url: part.FileData.FileUri, MimeType: part.FileData.MimeType})
		}
	}
	return attachments
}

func extractChatLogMessages(request dto.Request) []chatLogMessage {
	if request == nil {
		return nil
	}
	switch req := request.(type) {
	case *dto.GeneralOpenAIRequest:
		messages := make([]chatLogMessage, 0, len(req.Messages))
		for _, m := range req.Messages {
			content := m.StringContent()
			var attachments []chatLogAttachment
			if common.ChatLogAttachmentsEnabled {
				attachments = openAIMessageAttachments(&m)
			}
			if content == "" && len(attachments) == 0 {
				continue
			}
			role := m.Role
			if role == "" {
				role = "user"
			}
			messages = append(messages, chatLogMessage{Role: role, Content: content, Attachments: attachments})
		}
		return messages
	case *dto.ClaudeRequest:
		messages := make([]chatLogMessage, 0, len(req.Messages)+1)
		if req.System != nil {
			if content := claudeSystemText(req); content != "" {
				messages = append(messages, chatLogMessage{Role: "system", Content: content})
			}
		}
		for _, m := range req.Messages {
			content := m.GetStringContent()
			var attachments []chatLogAttachment
			if common.ChatLogAttachmentsEnabled {
				attachments = claudeMessageAttachments(&m)
			}
			if content == "" && len(attachments) == 0 {
				continue
			}
			role := m.Role
			if role == "" {
				role = "user"
			}
			messages = append(messages, chatLogMessage{Role: role, Content: content, Attachments: attachments})
		}
		return messages
	case *dto.GeminiChatRequest:
		messages := make([]chatLogMessage, 0, len(req.Contents)+1)
		if req.SystemInstructions != nil {
			if content := geminiPartsText(req.SystemInstructions.Parts); content != "" {
				messages = append(messages, chatLogMessage{Role: "system", Content: content})
			}
		}
		for _, content := range req.Contents {
			text := geminiPartsText(content.Parts)
			var attachments []chatLogAttachment
			if common.ChatLogAttachmentsEnabled {
				attachments = geminiMessageAttachments(content.Parts)
			}
			if text == "" && len(attachments) == 0 {
				continue
			}
			role := content.Role
			if role == "" {
				role = "user"
			}
			messages = append(messages, chatLogMessage{Role: role, Content: text, Attachments: attachments})
		}
		return messages
	case *dto.OpenAIResponsesRequest:
		inputs := req.ParseInput()
		var attachments []chatLogAttachment
		messages := make([]chatLogMessage, 0, len(inputs))
		for _, in := range inputs {
			if common.ChatLogAttachmentsEnabled {
				if in.ImageUrl != "" {
					attachments = append(attachments, chatLogAttachment{Type: "image", Url: in.ImageUrl})
				}
				if in.FileUrl != "" {
					attachments = append(attachments, chatLogAttachment{Type: "file", Url: in.FileUrl})
				}
			}
			if in.Text == "" {
				continue
			}
			messages = append(messages, chatLogMessage{Role: "user", Content: in.Text})
		}
		if len(attachments) > 0 {
			if len(messages) == 0 {
				messages = append(messages, chatLogMessage{Role: "user", Attachments: attachments})
			} else {
				messages[0].Attachments = append(messages[0].Attachments, attachments...)
			}
		}
		return messages
	}
	return nil
}

func claudeSystemText(req *dto.ClaudeRequest) string {
	if req.IsStringSystem() {
		return req.GetStringSystem()
	}
	var sb strings.Builder
	for _, media := range req.ParseSystem() {
		if media.Type == "text" {
			sb.WriteString(media.GetText())
		}
	}
	return sb.String()
}

func geminiPartsText(parts []dto.GeminiPart) string {
	var sb strings.Builder
	for _, part := range parts {
		if part.Text != "" {
			sb.WriteString(part.Text)
		}
	}
	return sb.String()
}

func extractChatLogReply(format types.RelayFormat, isStream bool, body []byte) string {
	if len(body) == 0 {
		return ""
	}
	if isStream {
		return extractStreamReply(format, body)
	}
	return extractNonStreamReply(format, body)
}

func extractNonStreamReply(format types.RelayFormat, body []byte) string {
	switch format {
	case types.RelayFormatClaude:
		var sb strings.Builder
		for _, item := range gjson.GetBytes(body, "content").Array() {
			if item.Get("type").String() == "text" {
				sb.WriteString(item.Get("text").String())
			}
		}
		return sb.String()
	case types.RelayFormatGemini:
		var sb strings.Builder
		for _, part := range gjson.GetBytes(body, "candidates.0.content.parts").Array() {
			sb.WriteString(part.Get("text").String())
		}
		return sb.String()
	case types.RelayFormatOpenAIResponses:
		var sb strings.Builder
		for _, output := range gjson.GetBytes(body, "output").Array() {
			for _, content := range output.Get("content").Array() {
				if content.Get("type").String() == "output_text" {
					sb.WriteString(content.Get("text").String())
				}
			}
		}
		return sb.String()
	default:
		return gjson.GetBytes(body, "choices.0.message.content").String()
	}
}

func extractStreamReply(format types.RelayFormat, body []byte) string {
	var sb strings.Builder
	for _, line := range strings.Split(string(body), "\n") {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		data := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if data == "" || data == "[DONE]" {
			continue
		}
		switch format {
		case types.RelayFormatClaude:
			if gjson.Get(data, "type").String() == "content_block_delta" {
				sb.WriteString(gjson.Get(data, "delta.text").String())
			}
		case types.RelayFormatGemini:
			sb.WriteString(gjson.Get(data, "candidates.0.content.parts.0.text").String())
		case types.RelayFormatOpenAIResponses:
			if gjson.Get(data, "type").String() == "response.output_text.delta" {
				sb.WriteString(gjson.Get(data, "delta").String())
			}
		default:
			sb.WriteString(gjson.Get(data, "choices.0.delta.content").String())
		}
	}
	return sb.String()
}

func buildChatLogRows(c *gin.Context, info *relaycommon.RelayInfo, messages []chatLogMessage, reply string, status int) []*model.ChatLog {
	createdAt := common.GetTimestamp()
	base := model.ChatLog{
		UserId:            info.UserId,
		TokenName:         c.GetString("token_name"),
		ModelName:         info.OriginModelName,
		ChannelId:         info.GetChannelID(),
		Group:             info.UsingGroup,
		RequestId:         info.RequestId,
		UpstreamRequestId: c.GetString(common.UpstreamRequestIdKey),
		ConversationId:    c.GetHeader(chatLogConversationIdHeader),
		IsStream:          info.IsStream,
		Status:            status,
		LatencyMs:         model.ChatLogLatencyMs(info.StartTime),
		Ip:                c.ClientIP(),
		CreatedAt:         createdAt,
	}

	promptTokens := info.GetEstimatePromptTokens()
	rows := make([]*model.ChatLog, 0, len(messages)+1)
	for i, msg := range messages {
		row := base
		row.Seq = i
		row.Role = msg.Role
		row.Content = msg.Content
		if len(msg.Attachments) > 0 {
			if b, err := common.Marshal(msg.Attachments); err == nil {
				row.Attachments = model.JSONValue(b)
			}
		}
		rows = append(rows, &row)
	}

	if reply != "" {
		row := base
		row.Seq = len(messages)
		row.Role = "assistant"
		row.Content = reply
		row.PromptTokens = promptTokens
		row.CompletionTokens = CountTextToken(reply, info.OriginModelName)
		rows = append(rows, &row)
	}

	return rows
}
