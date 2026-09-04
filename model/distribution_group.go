package model

import (
	"errors"

	"github.com/QuantumNous/new-api/common"

	"gorm.io/gorm"
)

const (
	MinCommissionRate = 0.0
	MaxCommissionRate = 100.0
)

// DistributionGroup 分销分组，每个分组可配置按下级实际消耗额度计算的提成比例（0~100%）。
type DistributionGroup struct {
	Id             int            `json:"id"`
	Name           string         `json:"name" gorm:"size:64;not null;uniqueIndex:uk_distribution_group_name,where:deleted_at IS NULL"`
	CommissionRate float64        `json:"commission_rate" gorm:"type:decimal(5,2);size:5;not null;default:0.000000"`
	IsDefault      bool           `json:"is_default" gorm:"type:boolean;default:false"`
	Description    string         `json:"description,omitempty" gorm:"type:varchar(255)"`
	MemberCount    int            `json:"member_count" gorm:"-"`
	CreatedTime    int64          `json:"created_time" gorm:"bigint"`
	UpdatedTime    int64          `json:"updated_time" gorm:"bigint"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

// IsDistributionGroupNameDuplicated 检查分组名称是否重复（排除自身 ID）
func IsDistributionGroupNameDuplicated(id int, name string) (bool, error) {
	if name == "" {
		return false, nil
	}
	var cnt int64
	err := DB.Model(&DistributionGroup{}).Where("name = ? AND id <> ?", name, id).Count(&cnt).Error
	return cnt > 0, err
}

// clearDefaultDistributionGroup 清除所有其它分组的默认标记，保证最多存在一个默认分组
func clearDefaultDistributionGroup(tx *gorm.DB, excludeId int) error {
	return tx.Model(&DistributionGroup{}).Where("id <> ?", excludeId).Update("is_default", false).Error
}

// Insert 新建分组
func (g *DistributionGroup) Insert() error {
	now := common.GetTimestamp()
	g.CreatedTime = now
	g.UpdatedTime = now
	return DB.Transaction(func(tx *gorm.DB) error {
		if g.IsDefault {
			if err := clearDefaultDistributionGroup(tx, 0); err != nil {
				return err
			}
		}
		return tx.Create(g).Error
	})
}

// Update 更新分组
func (g *DistributionGroup) Update() error {
	g.UpdatedTime = common.GetTimestamp()
	return DB.Transaction(func(tx *gorm.DB) error {
		if g.IsDefault {
			if err := clearDefaultDistributionGroup(tx, g.Id); err != nil {
				return err
			}
		}
		return tx.Save(g).Error
	})
}

// DeleteDistributionGroupByID 删除分组，默认分组不可删除
func DeleteDistributionGroupByID(id int) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		var group DistributionGroup
		if err := tx.First(&group, id).Error; err != nil {
			return err
		}
		if group.IsDefault {
			return errors.New("默认分销分组不可删除")
		}
		return tx.Delete(&DistributionGroup{}, id).Error
	})
}

// GetAllDistributionGroups 获取全部分组
func GetAllDistributionGroups() ([]*DistributionGroup, error) {
	var groups []*DistributionGroup
	if err := DB.Model(&DistributionGroup{}).Order("is_default DESC, id ASC").Find(&groups).Error; err != nil {
		return nil, err
	}
	if err := fillDistributionGroupMemberCounts(groups); err != nil {
		return nil, err
	}
	return groups, nil
}

// fillDistributionGroupMemberCounts 填充每个分组的成员数
func fillDistributionGroupMemberCounts(groups []*DistributionGroup) error {
	if len(groups) == 0 {
		return nil
	}
	type cnt struct {
		GroupId     int `gorm:"column:distribution_group_id"`
		MemberCount int `gorm:"column:cnt"`
	}
	var counts []cnt
	if err := DB.Model(&User{}).
		Select("distribution_group_id, COUNT(*) AS cnt").
		Where("distribution_group_id > 0").
		Group("distribution_group_id").
		Scan(&counts).Error; err != nil {
		return err
	}
	countMap := make(map[int]int, len(counts))
	for _, c := range counts {
		countMap[c.GroupId] = c.MemberCount
	}
	for _, g := range groups {
		g.MemberCount = countMap[g.Id]
	}
	return nil
}

// GetDistributionGroupByID 按 ID 获取分组
func GetDistributionGroupByID(id int) (*DistributionGroup, error) {
	var group DistributionGroup
	if err := DB.First(&group, id).Error; err != nil {
		return nil, err
	}
	return &group, nil
}

// defaultDistributionGroupTx 在指定事务内获取默认分组，不存在时返回 nil。
func defaultDistributionGroupTx(tx *gorm.DB) (*DistributionGroup, error) {
	var group DistributionGroup
	err := tx.Where("is_default = ?", true).First(&group).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &group, nil
}

// GetDefaultDistributionGroup 获取默认分组，不存在时返回 nil
func GetDefaultDistributionGroup() (*DistributionGroup, error) {
	return defaultDistributionGroupTx(DB)
}

// EnsureDefaultDistributionGroup 确保存在一个默认分销分组；不存在时自动创建
// 一个名称为「默认分组」、提成比例为 0 的分组。
func EnsureDefaultDistributionGroup() error {
	def, err := GetDefaultDistributionGroup()
	if err != nil {
		return err
	}
	if def != nil {
		return nil
	}
	now := common.GetTimestamp()
	g := &DistributionGroup{
		Name:           "默认分组",
		CommissionRate: 0,
		IsDefault:      true,
		CreatedTime:    now,
		UpdatedTime:    now,
	}
	return g.Insert()
}

// AssignUsersToDefaultDistributionGroup 将所有未分配分销分组的用户归入默认分组，
// 保证每个用户都属于一个分销分组。
func AssignUsersToDefaultDistributionGroup() error {
	def, err := GetDefaultDistributionGroup()
	if err != nil {
		return err
	}
	if def == nil {
		return nil
	}
	return DB.Model(&User{}).Where("distribution_group_id = 0").Update("distribution_group_id", def.Id).Error
}

// InitializeDistribution 初始化分销：确保默认分组存在，并将存量未分组用户归入默认分组。
func InitializeDistribution() error {
	if err := EnsureDefaultDistributionGroup(); err != nil {
		return err
	}
	return AssignUsersToDefaultDistributionGroup()
}
