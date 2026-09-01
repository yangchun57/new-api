package controller

import (
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

// GetDistributionGroups 获取分销分组列表
func GetDistributionGroups(c *gin.Context) {
	groups, err := model.GetAllDistributionGroups()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, groups)
}

func validateDistributionGroup(g *model.DistributionGroup) string {
	if g.Name == "" {
		return "分销分组名称不能为空"
	}
	if g.CommissionRate < model.MinCommissionRate || g.CommissionRate > model.MaxCommissionRate {
		return "提成比例必须在 0 到 100 之间"
	}
	return ""
}

// CreateDistributionGroup 创建分销分组
func CreateDistributionGroup(c *gin.Context) {
	var g model.DistributionGroup
	if err := c.ShouldBindJSON(&g); err != nil {
		common.ApiError(c, err)
		return
	}
	if msg := validateDistributionGroup(&g); msg != "" {
		common.ApiErrorMsg(c, msg)
		return
	}
	if dup, err := model.IsDistributionGroupNameDuplicated(0, g.Name); err != nil {
		common.ApiError(c, err)
		return
	} else if dup {
		common.ApiErrorMsg(c, "分销分组名称已存在")
		return
	}

	if err := g.Insert(); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, &g)
}

// UpdateDistributionGroup 更新分销分组
func UpdateDistributionGroup(c *gin.Context) {
	var g model.DistributionGroup
	if err := c.ShouldBindJSON(&g); err != nil {
		common.ApiError(c, err)
		return
	}
	if g.Id == 0 {
		common.ApiErrorMsg(c, "缺少分销分组 ID")
		return
	}
	if msg := validateDistributionGroup(&g); msg != "" {
		common.ApiErrorMsg(c, msg)
		return
	}
	if dup, err := model.IsDistributionGroupNameDuplicated(g.Id, g.Name); err != nil {
		common.ApiError(c, err)
		return
	} else if dup {
		common.ApiErrorMsg(c, "分销分组名称已存在")
		return
	}

	if err := g.Update(); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, &g)
}

// DeleteDistributionGroup 删除分销分组
func DeleteDistributionGroup(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.DeleteDistributionGroupByID(id); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}
