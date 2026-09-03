package controller

import (
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

func parseChatLogQuery(c *gin.Context) model.ChatLogQueryParams {
	params := model.ChatLogQueryParams{}
	params.StartTimestamp, _ = strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	params.EndTimestamp, _ = strconv.ParseInt(c.Query("end_timestamp"), 10, 64)
	params.UserId, _ = strconv.Atoi(c.Query("user_id"))
	params.ModelName = c.Query("model_name")
	params.TokenName = c.Query("token_name")
	params.Role = c.Query("role")
	params.ConversationId = c.Query("conversation_id")
	params.RequestId = c.Query("request_id")
	params.Keyword = c.Query("keyword")
	return params
}

func GetAllChatLogs(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	params := parseChatLogQuery(c)
	params.StartIdx = pageInfo.GetStartIdx()
	params.Num = pageInfo.GetPageSize()
	logs, total, err := model.GetAllChatLogs(params)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(logs)
	common.ApiSuccess(c, pageInfo)
}

func GetUserChatLogs(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	userId := c.GetInt("id")
	params := parseChatLogQuery(c)
	params.UserId = 0
	params.StartIdx = pageInfo.GetStartIdx()
	params.Num = pageInfo.GetPageSize()
	logs, total, err := model.GetUserChatLogs(userId, params)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(logs)
	common.ApiSuccess(c, pageInfo)
}
