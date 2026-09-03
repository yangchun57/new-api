package service

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"

	"github.com/bytedance/gopkg/util/gopool"
)

const (
	distributionSettlementTickInterval = 1 * time.Minute
	distributionSettlementHour         = 0
	distributionSettlementMinute       = 5
	distributionSettlementBatchSize    = 300
)

var (
	distributionSettlementOnce     sync.Once
	distributionSettlementRunning  atomic.Bool
	distributionSettlementLastDate atomic.Value
)

// StartDistributionDailySettlementTask 启动每日分销消费提成结算任务，
// 每天 00:05 结算下级在前一日产生的实际 API 消耗提成。
func StartDistributionDailySettlementTask() {
	distributionSettlementOnce.Do(func() {
		if !common.IsMasterNode {
			return
		}
		gopool.Go(func() {
			logger.LogInfo(context.Background(), fmt.Sprintf("distribution daily settlement task started: tick=%s, schedule=%02d:%02d", distributionSettlementTickInterval, distributionSettlementHour, distributionSettlementMinute))
			ticker := time.NewTicker(distributionSettlementTickInterval)
			defer ticker.Stop()

			runDistributionDailySettlementOnce()
			for range ticker.C {
				runDistributionDailySettlementOnce()
			}
		})
	})
}

func runDistributionDailySettlementOnce() {
	now := time.Now()
	if now.Hour() != distributionSettlementHour || now.Minute() < distributionSettlementMinute {
		return
	}
	settleDate := now.Format("2006-01-02")
	if lastDate, ok := distributionSettlementLastDate.Load().(string); ok && lastDate == settleDate {
		return
	}
	if !distributionSettlementRunning.CompareAndSwap(false, true) {
		return
	}
	defer distributionSettlementRunning.Store(false)

	ctx := context.Background()
	creditedTotal := 0
	for {
		credited, processed, err := model.SettleDistributionDailyConsumption(settleDate, distributionSettlementBatchSize)
		if err != nil {
			logger.LogWarn(ctx, fmt.Sprintf("distribution daily settlement failed: %v", err))
			return
		}
		creditedTotal += credited
		if processed < distributionSettlementBatchSize {
			break
		}
	}
	distributionSettlementLastDate.Store(settleDate)
	if creditedTotal > 0 || common.DebugEnabled {
		logger.LogInfo(ctx, fmt.Sprintf("distribution daily settlement completed: date=%s credited=%d", settleDate, creditedTotal))
	}
}
