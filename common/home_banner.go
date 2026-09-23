package common

import (
	"os"
	"strings"
)

// HomeBannerURLPrefix 是首页 banner 图片的公开访问前缀
const HomeBannerURLPrefix = "/uploads/banner"

// MaxHomeBanners 是首页 banner 允许的最大数量
const MaxHomeBanners = 20

// GetHomeBannerDir 返回首页 banner 图片的存储目录
func GetHomeBannerDir() string {
	return GetEnvOrDefaultString("HOME_BANNER_DIR", "./data/banner")
}

// EnsureHomeBannerDir 确保 banner 存储目录存在并返回其路径
func EnsureHomeBannerDir() (string, error) {
	dir := GetHomeBannerDir()
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}
	return dir, nil
}

// HomeBanners2JSONString 将 banner 列表序列化为 JSON 字符串
func HomeBanners2JSONString() string {
	data, err := Marshal(HomeBanners)
	if err != nil {
		return "[]"
	}
	return string(data)
}

// ValidateHomeBannersJSON 校验 banner 列表的 JSON 格式
func ValidateHomeBannersJSON(value string) error {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	var banners []string
	return UnmarshalJsonStr(value, &banners)
}

// UpdateHomeBannersByJSONString 解析并保存 banner 列表
func UpdateHomeBannersByJSONString(value string) error {
	if strings.TrimSpace(value) == "" {
		HomeBanners = []string{}
		return nil
	}
	var banners []string
	if err := UnmarshalJsonStr(value, &banners); err != nil {
		return err
	}
	HomeBanners = sanitizeHomeBanners(banners)
	return nil
}

// sanitizeHomeBanners 去重、过滤非法地址并限制数量
func sanitizeHomeBanners(banners []string) []string {
	result := make([]string, 0, len(banners))
	seen := make(map[string]struct{}, len(banners))
	for _, raw := range banners {
		url := strings.TrimSpace(raw)
		if !isAllowedBannerURL(url) {
			continue
		}
		if _, ok := seen[url]; ok {
			continue
		}
		seen[url] = struct{}{}
		result = append(result, url)
		if len(result) >= MaxHomeBanners {
			break
		}
	}
	return result
}

func isAllowedBannerURL(url string) bool {
	if url == "" {
		return false
	}
	return strings.HasPrefix(url, "/") ||
		strings.HasPrefix(url, "http://") ||
		strings.HasPrefix(url, "https://")
}
