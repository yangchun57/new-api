package model

import (
	"errors"

	"github.com/QuantumNous/new-api/common"

	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// DistributionLedger 分销提成台账，记录每一笔按下级实际消耗额度结算的提成与人工扣减。
type DistributionLedger struct {
	Id            int64  `json:"id"`
	UserId        int    `json:"user_id" gorm:"index"`
	User          *User  `gorm:"foreignKey:UserId;references:Id"`
	UserName      string `json:"user_name" gorm:"-"`
	InviteeId     int    `json:"invitee_id" gorm:"index"`
	Invitee       *User  `gorm:"foreignKey:InviteeId;references:Id"`
	InviteeName   string `json:"invitee_name" gorm:"-"`
	TopUpId       int    `json:"top_up_id" gorm:"index"`
	TradeNo       string `json:"trade_no" gorm:"type:varchar(255);index"`
	Type          int    `json:"type"`
	Amount        int    `json:"amount" gorm:"type:bigint"`
	ConsumedQuota int    `json:"consumed_quota" gorm:"type:bigint"`
	SettleDate    string `json:"settle_date" gorm:"type:varchar(10);index"`
	DebtApplied   int    `json:"debt_applied" gorm:"type:bigint"`
	Credited      int    `json:"credited" gorm:"type:bigint"`
	Remark        string `json:"remark,omitempty" gorm:"type:varchar(255)"`
	CreatedTime   int64  `json:"created_time" gorm:"bigint"`
}

const (
	DistributionLedgerTypeEarn   = 1
	DistributionLedgerTypeRefund = 2
	DistributionLedgerTypeDeduct = 3
)

// creditDistributionBalance 在事务内给分销用户余额加额度，上限为 MaxWalletQuota。
// 若余额已达上限则跳过本次入账，返回实际入账额度。
func creditDistributionBalance(tx *gorm.DB, userId int, amount int) (int, error) {
	if amount <= 0 {
		return 0, nil
	}
	result := tx.Model(&User{}).
		Where("id = ? AND quota <= ?", userId, common.MaxWalletQuota-amount).
		Update("quota", gorm.Expr("quota + ?", amount))
	if result.Error != nil {
		return 0, result.Error
	}
	if result.RowsAffected == 1 {
		return amount, nil
	}
	var count int64
	if err := tx.Model(&User{}).Where("id = ?", userId).Count(&count).Error; err != nil {
		return 0, err
	}
	if count == 0 {
		return 0, gorm.ErrRecordNotFound
	}
	return 0, nil
}

// deductDistributionBalance 在事务内从用户余额扣减，余额不足部分记为负资产（欠款）。
// 返回实际从余额扣减的额度与转为欠款的额度。
func deductDistributionBalance(tx *gorm.DB, userId int, amount int) (int, int, error) {
	if amount <= 0 {
		return 0, 0, nil
	}
	var user User
	if err := lockForUpdate(tx).Select("id", "quota").Where("id = ?", userId).First(&user).Error; err != nil {
		return 0, 0, err
	}
	deducted := 0
	if user.Quota > 0 {
		deducted = amount
		if user.Quota < deducted {
			deducted = user.Quota
		}
	}
	if deducted > 0 {
		if err := tx.Model(&User{}).Where("id = ?", userId).Update("quota", gorm.Expr("quota - ?", deducted)).Error; err != nil {
			return 0, 0, err
		}
	}
	return deducted, amount - deducted, nil
}

// resolveDistributionCommissionRate 解析分销用户的提成比例：优先使用用户所在分组，
// 未分配分组时回退到默认分组；均不存在时比例为 0。
func resolveDistributionCommissionRate(tx *gorm.DB, groupId int) (float64, error) {
	if groupId > 0 {
		var group DistributionGroup
		err := tx.Where("id = ?", groupId).First(&group).Error
		if err == nil && group.Id > 0 {
			return group.CommissionRate, nil
		}
	}
	var def DistributionGroup
	err := tx.Where("is_default = ?", true).First(&def).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return 0, nil
		}
		return 0, err
	}
	return def.CommissionRate, nil
}

// invalidDistributionReferral 反作弊：邀请人与被邀请人同 IP、同设备指纹或同支付账户
// 视为无效推广，不计算提成。
func invalidDistributionReferral(inviter User, invitee User) bool {
	if inviter.RegisterIp != "" && inviter.RegisterIp == invitee.RegisterIp {
		return true
	}
	if inviter.DeviceFingerprint != "" && inviter.DeviceFingerprint == invitee.DeviceFingerprint {
		return true
	}
	if inviter.StripeCustomer != "" && inviter.StripeCustomer == invitee.StripeCustomer {
		return true
	}
	return false
}

// advanceDistributionSettlementWatermark 将被邀请人的结算水位推进到其当前累计消耗值，
// 确保每一段消耗只结算一次，不重不漏。
func advanceDistributionSettlementWatermark(tx *gorm.DB, inviteeId int, usedQuota int) error {
	return tx.Model(&User{}).Where("id = ?", inviteeId).Update("distribution_settled_used_quota", usedQuota).Error
}

// settleDistributionConsumption 在独立事务内结算单个被邀请人自上次结算以来的
// 实际 API 消耗增量。佣金优先抵扣邀请人欠款，剩余部分入邀请人余额。
func settleDistributionConsumption(inviteeId int, settleDate string) (int, error) {
	var creditedTotal int
	err := DB.Transaction(func(tx *gorm.DB) error {
		var invitee User
		if err := lockForUpdate(tx).Select("id", "inviter_id", "used_quota", "distribution_settled_used_quota", "register_ip", "device_fingerprint", "stripe_customer").Where("id = ?", inviteeId).First(&invitee).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil
			}
			return err
		}
		if invitee.InviterId <= 0 || invitee.InviterId == inviteeId {
			return nil
		}
		delta := invitee.UsedQuota - invitee.DistributionSettledUsedQuota
		if delta <= 0 {
			return nil
		}

		var inviter User
		if err := lockForUpdate(tx).Select("id", "quota", "distribution_debt", "distribution_frozen", "distribution_enabled", "distribution_group_id", "register_ip", "device_fingerprint", "stripe_customer").Where("id = ?", invitee.InviterId).First(&inviter).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil
			}
			return err
		}

		if !inviter.DistributionEnabled || inviter.DistributionFrozen || (common.DistributionAntiCheatEnabled && invalidDistributionReferral(inviter, invitee)) {
			return nil
		}

		rate, err := resolveDistributionCommissionRate(tx, inviter.DistributionGroupId)
		if err != nil {
			return err
		}
		if rate <= 0 {
			return nil
		}

		commission, err := common.WalletQuotaFromDecimalStrict(
			decimal.NewFromInt(int64(delta)).Mul(decimal.NewFromFloat(rate)).Div(decimal.NewFromInt(100)),
		)
		if err != nil {
			return err
		}
		if commission <= 0 {
			return nil
		}

		debtRepay := commission
		if inviter.DistributionDebt < debtRepay {
			debtRepay = inviter.DistributionDebt
		}
		remaining := commission - debtRepay

		if debtRepay > 0 {
			if err := tx.Model(&User{}).Where("id = ?", inviter.Id).Update("distribution_debt", gorm.Expr("distribution_debt - ?", debtRepay)).Error; err != nil {
				return err
			}
		}

		credited := 0
		if remaining > 0 {
			credited, err = creditDistributionBalance(tx, inviter.Id, remaining)
			if err != nil {
				return err
			}
		}

		ledger := &DistributionLedger{
			UserId:        inviter.Id,
			InviteeId:     invitee.Id,
			Type:          DistributionLedgerTypeEarn,
			Amount:        commission,
			ConsumedQuota: delta,
			SettleDate:    settleDate,
			DebtApplied:   debtRepay,
			Credited:      credited,
			CreatedTime:   common.GetTimestamp(),
		}
		if credited < remaining {
			ledger.Remark = "balance at ceiling; partial credit skipped"
		}
		if err := tx.Create(ledger).Error; err != nil {
			return err
		}

		creditedTotal = credited
		return advanceDistributionSettlementWatermark(tx, invitee.Id, invitee.UsedQuota)
	})
	return creditedTotal, err
}

// SettleDistributionDailyConsumption 每日结算一批下级消耗产生的分销提成。
// 按被邀请人的累计消耗值与结算水位的差值计算佣金，返回本批实际入账的佣金总额
// 与已处理的被邀请人数量。
func SettleDistributionDailyConsumption(settleDate string, batchSize int) (int, int, error) {
	if batchSize <= 0 {
		batchSize = 100
	}
	var ids []int
	if err := DB.Model(&User{}).
		Where("inviter_id > 0 AND inviter_id <> id AND used_quota > distribution_settled_used_quota").
		Order("id asc").
		Limit(batchSize).
		Pluck("id", &ids).Error; err != nil {
		return 0, 0, err
	}
	creditedTotal := 0
	processed := 0
	for _, id := range ids {
		credited, err := settleDistributionConsumption(id, settleDate)
		if err != nil {
			return creditedTotal, processed, err
		}
		creditedTotal += credited
		processed++
	}
	return creditedTotal, processed, nil
}

// DeductDistributionCommission 人工扣减指定分销用户的佣金，余额不足部分记为负资产。
func DeductDistributionCommission(userId int, amount int, remark string) error {
	if userId <= 0 || amount <= 0 {
		return errors.New("参数错误")
	}
	if err := common.ValidateWalletQuota(amount); err != nil {
		return err
	}
	return DB.Transaction(func(tx *gorm.DB) error {
		_, debtIncrease, err := deductDistributionBalance(tx, userId, amount)
		if err != nil {
			return err
		}
		if debtIncrease > 0 {
			if err := tx.Model(&User{}).Where("id = ?", userId).Update("distribution_debt", gorm.Expr("distribution_debt + ?", debtIncrease)).Error; err != nil {
				return err
			}
		}
		ledger := &DistributionLedger{
			UserId:      userId,
			Type:        DistributionLedgerTypeDeduct,
			Amount:      -amount,
			DebtApplied: debtIncrease,
			Remark:      remark,
			CreatedTime: common.GetTimestamp(),
		}
		return tx.Create(ledger).Error
	})
}

// DeductAllDistributionCommission 扣除指定分销用户历史累计未回滚的提成。
func DeductAllDistributionCommission(userId int, remark string) error {
	if userId <= 0 {
		return errors.New("参数错误")
	}
	var net int64
	if err := DB.Model(&DistributionLedger{}).Where("user_id = ? AND type IN ?", userId, []int{DistributionLedgerTypeEarn, DistributionLedgerTypeRefund}).Select("COALESCE(SUM(amount), 0)").Scan(&net).Error; err != nil {
		return err
	}
	if net <= 0 {
		return nil
	}
	return DeductDistributionCommission(userId, int(net), remark)
}

// SetUserDistributionFrozen 冻结或解冻分销用户的计佣。
func SetUserDistributionFrozen(userId int, frozen bool) error {
	if userId <= 0 {
		return errors.New("用户 ID 为空")
	}
	return DB.Model(&User{}).Where("id = ?", userId).Update("distribution_frozen", frozen).Error
}

const distributionEnabledMigratedOptionKey = "distribution_enabled_default_migrated"

// MigrateDistributionEnabledDefault 一次性将存量用户的分销权限默认开启。
// 使用 Option 标记确保只执行一次，之后管理员仍可单独停用某个用户。
func MigrateDistributionEnabledDefault() error {
	var count int64
	if err := DB.Model(&Option{}).Where("key = ?", distributionEnabledMigratedOptionKey).Count(&count).Error; err != nil {
		return err
	}
	if count > 0 {
		return nil
	}
	if err := DB.Model(&User{}).Where("distribution_enabled = ?", false).Update("distribution_enabled", true).Error; err != nil {
		return err
	}
	return DB.Create(&Option{Key: distributionEnabledMigratedOptionKey, Value: "1"}).Error
}

// SetUserDistributionEnabled 启用或停用用户的分销权限。无分销权限的用户
// 不会参与分销结算，也不会作为邀请人产生提成。
func SetUserDistributionEnabled(userId int, enabled bool) error {
	if userId <= 0 {
		return errors.New("用户 ID 为空")
	}
	return DB.Model(&User{}).Where("id = ?", userId).Update("distribution_enabled", enabled).Error
}

// SetUserDistributionGroup 将用户分配到指定分销分组；groupId 为 0 时归入默认分组。
func SetUserDistributionGroup(userId int, groupId int) error {
	if userId <= 0 {
		return errors.New("用户 ID 为空")
	}
	if groupId < 0 {
		return errors.New("分销分组 ID 非法")
	}
	if groupId == 0 {
		def, err := GetDefaultDistributionGroup()
		if err != nil {
			return err
		}
		if def == nil {
			return errors.New("默认分销分组不存在")
		}
		groupId = def.Id
	}
	if _, err := GetDistributionGroupByID(groupId); err != nil {
		return err
	}
	return DB.Model(&User{}).Where("id = ?", userId).Update("distribution_group_id", groupId).Error
}

// GetDistributionLedgers 分页查询分销提成台账；userId 为 0 时查询全部。
func GetDistributionLedgers(userId int, pageInfo *common.PageInfo) (ledgers []*DistributionLedger, total int64, err error) {
	tx := DB.Model(&DistributionLedger{})
	if userId > 0 {
		tx = tx.Where("user_id = ?", userId)
	}
	if err = tx.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	err = tx.Preload("User", func(db *gorm.DB) *gorm.DB {
		return db.Select("id", "username", "display_name")
	}).Preload("Invitee", func(db *gorm.DB) *gorm.DB {
		return db.Select("id", "username", "display_name")
	}).Order("id desc").Limit(pageInfo.GetPageSize()).Offset(pageInfo.GetStartIdx()).Find(&ledgers).Error
	if err != nil {
		return nil, 0, err
	}
	for _, ledger := range ledgers {
		if ledger.User != nil {
			if ledger.User.DisplayName != "" {
				ledger.UserName = ledger.User.DisplayName
			} else {
				ledger.UserName = ledger.User.Username
			}
		}
		if ledger.Invitee != nil {
			if ledger.Invitee.DisplayName != "" {
				ledger.InviteeName = ledger.Invitee.DisplayName
			} else {
				ledger.InviteeName = ledger.Invitee.Username
			}
		}
	}
	return ledgers, total, err
}

func (DistributionLedger) TableName() string {
	return "distribution_ledgers"
}
