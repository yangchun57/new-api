package service

import (
	"context"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
)

const chatLogCleanupInterval = 24 * time.Hour

// StartChatLogCleanup 定期清理超过留存期限的会话正文。仅 master 节点执行。
func StartChatLogCleanup() {
	if !common.IsMasterNode || common.ChatLogRetentionDays <= 0 {
		return
	}
	go func() {
		cleanupChatLogs()
		ticker := time.NewTicker(chatLogCleanupInterval)
		defer ticker.Stop()
		for range ticker.C {
			cleanupChatLogs()
		}
	}()
}

func cleanupChatLogs() {
	ctx := context.Background()
	target := time.Now().AddDate(0, 0, -common.ChatLogRetentionDays).Unix()
	for {
		affected, err := model.DeleteOldChatLogs(ctx, target, 1000)
		if err != nil {
			common.SysError("failed to delete old chat logs: " + err.Error())
			return
		}
		if affected < 1000 {
			return
		}
	}
}
