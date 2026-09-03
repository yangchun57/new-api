package model

import (
	"context"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"

	"gorm.io/gorm"
)

// ChatLog 会话正文留存记录（消息级单表 + conversation_id 结构）。
// 每一次 relay 请求会写入若干行：请求中的各条消息（system/user/assistant/tool）
// 以及 AI 的完整回复（role=assistant）。
type ChatLog struct {
	Id                int    `gorm:"primaryKey" json:"id"`
	UserId            int    `gorm:"index" json:"user_id"`
	TokenName         string `gorm:"index" json:"token_name"`
	ModelName         string `gorm:"index" json:"model_name"`
	ChannelId         int    `json:"channel_id"`
	Group             string `json:"group"`
	RequestId         string `gorm:"index" json:"request_id"`
	UpstreamRequestId string `json:"upstream_request_id"`
	ConversationId    string `gorm:"index" json:"conversation_id"`
	Seq               int    `json:"seq"`
	Role              string `json:"role"`
	Content           string `gorm:"type:text" json:"content"`
	PromptTokens      int    `json:"prompt_tokens"`
	CompletionTokens  int    `json:"completion_tokens"`
	Quota             int    `json:"quota"`
	IsStream          bool   `json:"is_stream"`
	Status            int    `json:"status"`
	LatencyMs         int    `json:"latency_ms"`
	Ip                string `json:"ip"`
	CreatedAt         int64  `gorm:"index" json:"created_at"`
}

// ChatLog 状态取值，避免 0 值歧义。
const (
	ChatLogStatusFailed  = 2
	ChatLogStatusSuccess = 1
)

var (
	chatLogChan     = make(chan []*ChatLog, 1024)
	chatLogOnce     sync.Once
	chatLogDropOnce sync.Once
)

func startChatLogWorker() {
	go func() {
		for logs := range chatLogChan {
			if len(logs) == 0 {
				continue
			}
			if err := DB.CreateInBatches(logs, 100).Error; err != nil {
				common.SysError("failed to record chat logs: " + err.Error())
			}
		}
	}()
}

// RecordChatLogs 旁路异步写入会话正文，不阻塞主链路。
// channel 满时丢弃并告警，绝不阻塞请求处理。
func RecordChatLogs(logs []*ChatLog) {
	if !common.ChatLogEnabled || len(logs) == 0 {
		return
	}
	chatLogOnce.Do(startChatLogWorker)
	select {
	case chatLogChan <- logs:
	default:
		chatLogDropOnce.Do(func() {
			common.SysError("chat log channel full, dropping records (further drops suppressed)")
		})
	}
}

func applyChatLogTextFilter(tx *gorm.DB, column string, value string) (*gorm.DB, error) {
	if value == "" {
		return tx, nil
	}
	pattern, err := sanitizeLikePattern(value)
	if err != nil {
		return nil, err
	}
	return tx.Where(column+" LIKE ? ESCAPE '!'", "%"+pattern+"%"), nil
}

type ChatLogQueryParams struct {
	StartTimestamp int64
	EndTimestamp   int64
	UserId         int
	ModelName      string
	TokenName      string
	Role           string
	ConversationId string
	RequestId      string
	Keyword        string
	StartIdx       int
	Num            int
}

func buildChatLogQuery(params ChatLogQueryParams) (*gorm.DB, error) {
	tx := DB.Model(&ChatLog{})
	if params.UserId != 0 {
		tx = tx.Where("user_id = ?", params.UserId)
	}
	if params.StartTimestamp != 0 {
		tx = tx.Where("created_at >= ?", params.StartTimestamp)
	}
	if params.EndTimestamp != 0 {
		tx = tx.Where("created_at <= ?", params.EndTimestamp)
	}
	if params.Role != "" {
		tx = tx.Where("role = ?", params.Role)
	}
	if params.ConversationId != "" {
		tx = tx.Where("conversation_id = ?", params.ConversationId)
	}
	if params.RequestId != "" {
		tx = tx.Where("request_id = ?", params.RequestId)
	}
	if params.ModelName != "" {
		tx = tx.Where("model_name = ?", params.ModelName)
	}
	if params.TokenName != "" {
		tx = tx.Where("token_name = ?", params.TokenName)
	}
	var err error
	if tx, err = applyChatLogTextFilter(tx, "content", params.Keyword); err != nil {
		return nil, err
	}
	return tx, nil
}

func GetAllChatLogs(params ChatLogQueryParams) (logs []*ChatLog, total int64, err error) {
	tx, err := buildChatLogQuery(params)
	if err != nil {
		return nil, 0, err
	}
	if err = tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err = tx.Order("created_at desc, id desc").Limit(params.Num).Offset(params.StartIdx).Find(&logs).Error
	return logs, total, err
}

func GetUserChatLogs(userId int, params ChatLogQueryParams) (logs []*ChatLog, total int64, err error) {
	params.UserId = userId
	return GetAllChatLogs(params)
}

func DeleteOldChatLogs(ctx context.Context, targetTimestamp int64, limit int) (int64, error) {
	if limit <= 0 {
		limit = 100
	}
	if nil != ctx.Err() {
		return 0, ctx.Err()
	}
	result := DB.WithContext(ctx).Where("created_at < ?", targetTimestamp).Limit(limit).Delete(&ChatLog{})
	if nil != result.Error {
		return 0, result.Error
	}
	return result.RowsAffected, nil
}

func CountOldChatLogs(ctx context.Context, targetTimestamp int64) (int64, error) {
	var total int64
	if err := DB.WithContext(ctx).Model(&ChatLog{}).Where("created_at < ?", targetTimestamp).Count(&total).Error; err != nil {
		return 0, err
	}
	return total, nil
}

// ChatLogLatencyMs 返回距 startTime 的毫秒数，用于填充 ChatLog.LatencyMs。
func ChatLogLatencyMs(startTime time.Time) int {
	if startTime.IsZero() {
		return 0
	}
	elapsed := time.Since(startTime).Milliseconds()
	if elapsed < 0 {
		return 0
	}
	return int(elapsed)
}
