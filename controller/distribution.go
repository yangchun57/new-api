package controller

import (
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

type SetUserDistributionGroupRequest struct {
	UserId  int `json:"user_id"`
	GroupId int `json:"group_id"`
}

// SetUserDistributionGroup 管理员将用户分配到指定分销分组；groupId 为 0 表示移出分组。
func SetUserDistributionGroup(c *gin.Context) {
	var req SetUserDistributionGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if req.UserId <= 0 {
		common.ApiErrorMsg(c, "用户 ID 非法")
		return
	}
	if err := model.SetUserDistributionGroup(req.UserId, req.GroupId); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

type SetUserDistributionFrozenRequest struct {
	UserId int  `json:"user_id"`
	Frozen bool `json:"frozen"`
}

// SetUserDistributionFrozen 管理员冻结或解冻指定用户的分销计佣。
func SetUserDistributionFrozen(c *gin.Context) {
	var req SetUserDistributionFrozenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if req.UserId <= 0 {
		common.ApiErrorMsg(c, "用户 ID 非法")
		return
	}
	if err := model.SetUserDistributionFrozen(req.UserId, req.Frozen); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

type DeductDistributionCommissionRequest struct {
	UserId int    `json:"user_id"`
	Amount int    `json:"amount"`
	Remark string `json:"remark"`
}

type SetUserDistributionEnabledRequest struct {
	UserId  int  `json:"user_id"`
	Enabled bool `json:"enabled"`
}

// SetUserDistributionEnabled 管理员启用或停用指定用户的分销权限。
func SetUserDistributionEnabled(c *gin.Context) {
	var req SetUserDistributionEnabledRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if req.UserId <= 0 {
		common.ApiErrorMsg(c, "用户 ID 非法")
		return
	}
	if err := model.SetUserDistributionEnabled(req.UserId, req.Enabled); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// DeductDistributionCommission 管理员人工扣减指定分销用户的佣金，余额不足部分记为负资产。
func DeductDistributionCommission(c *gin.Context) {
	var req DeductDistributionCommissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if req.UserId <= 0 || req.Amount <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := model.DeductDistributionCommission(req.UserId, req.Amount, req.Remark); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

type DeductAllDistributionCommissionRequest struct {
	UserId int    `json:"user_id"`
	Remark string `json:"remark"`
}

// DeductAllDistributionCommission 管理员扣除指定分销用户历史累计未回滚的全部提成。
func DeductAllDistributionCommission(c *gin.Context) {
	var req DeductAllDistributionCommissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if req.UserId <= 0 {
		common.ApiErrorMsg(c, "参数错误")
		return
	}
	if err := model.DeductAllDistributionCommission(req.UserId, req.Remark); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// GetSelfDistributionLedgers 当前用户分页查询自己的分销提成台账。
func GetSelfDistributionLedgers(c *gin.Context) {
	userId := c.GetInt("id")
	if userId <= 0 {
		common.ApiErrorMsg(c, "用户 ID 非法")
		return
	}
	pageInfo := common.GetPageQuery(c)
	ledgers, total, err := model.GetDistributionLedgers(userId, pageInfo)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(ledgers)
	common.ApiSuccess(c, pageInfo)
}

// GetSelfInvitedUsers 当前用户分页查询自己邀请的账号。
func GetSelfInvitedUsers(c *gin.Context) {
	userId := c.GetInt("id")
	if userId <= 0 {
		common.ApiErrorMsg(c, "用户 ID 非法")
		return
	}
	pageInfo := common.GetPageQuery(c)
	items, total, err := model.GetInvitedUsers(userId, pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(items)
	common.ApiSuccess(c, pageInfo)
}

// GetDistributionLedgers 管理员分页查询分销提成台账；user_id 为空时查询全部。
func GetDistributionLedgers(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	userId := 0
	if idStr := c.Query("user_id"); idStr != "" {
		if parsed, err := strconv.Atoi(idStr); err == nil {
			userId = parsed
		}
	}
	ledgers, total, err := model.GetDistributionLedgers(userId, pageInfo)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(ledgers)
	common.ApiSuccess(c, pageInfo)
}

// GetDistributionUsers 管理员分页查询分销用户列表，支持关键字搜索和分组筛选。
func GetDistributionUsers(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	keyword := c.Query("keyword")
	groupId := 0
	if idStr := c.Query("group_id"); idStr != "" {
		if parsed, err := strconv.Atoi(idStr); err == nil {
			groupId = parsed
		}
	}
	var frozen *bool
	if frozenStr := c.Query("frozen"); frozenStr != "" {
		if frozenStr == "true" {
			v := true
			frozen = &v
		} else if frozenStr == "false" {
			v := false
			frozen = &v
		}
	}
	items, total, err := model.SearchDistributionUsers(keyword, groupId, frozen, pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(items)
	common.ApiSuccess(c, pageInfo)
}

// GetDistributionGroupMembers 管理员分页查询指定分销分组下的成员。
func GetDistributionGroupMembers(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	groupIdStr := c.Param("id")
	groupId, err := strconv.Atoi(groupIdStr)
	if err != nil || groupId <= 0 {
		common.ApiErrorMsg(c, "分组 ID 非法")
		return
	}
	items, total, err := model.GetDistributionGroupMembers(groupId, pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(items)
	common.ApiSuccess(c, pageInfo)
}
