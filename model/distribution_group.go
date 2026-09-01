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

// DistributionGroup 分销分组，每个分组可配置按下级充值金额计算的提成比例（0~100%）。
type DistributionGroup struct {
	Id             int            `json:"id"`
	Name           string         `json:"name" gorm:"size:64;not null;uniqueIndex:uk_distribution_group_name,where:deleted_at IS NULL"`
	CommissionRate float64        `json:"commission_rate" gorm:"type:decimal(5,2);not null;default:0"`
	IsDefault      bool           `json:"is_default" gorm:"type:boolean;default:false"`
	Description    string         `json:"description,omitempty" gorm:"type:varchar(255)"`
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
	return groups, nil
}

// GetDistributionGroupByID 按 ID 获取分组
func GetDistributionGroupByID(id int) (*DistributionGroup, error) {
	var group DistributionGroup
	if err := DB.First(&group, id).Error; err != nil {
		return nil, err
	}
	return &group, nil
}

// GetDefaultDistributionGroup 获取默认分组，不存在时返回 nil
func GetDefaultDistributionGroup() (*DistributionGroup, error) {
	var group DistributionGroup
	err := DB.Where("is_default = ?", true).First(&group).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &group, nil
}
