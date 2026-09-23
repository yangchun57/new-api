package common

import (
	"strconv"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestUpdateHomeBannersByJSONString(t *testing.T) {
	t.Cleanup(func() { HomeBanners = []string{} })

	require.NoError(t, UpdateHomeBannersByJSONString(`["/a.png","https://cdn.example.com/b.png"]`))
	assert.Equal(t, []string{"/a.png", "https://cdn.example.com/b.png"}, HomeBanners)

	require.NoError(t, UpdateHomeBannersByJSONString(``))
	assert.Empty(t, HomeBanners)
}

func TestUpdateHomeBannersSanitizesInput(t *testing.T) {
	t.Cleanup(func() { HomeBanners = []string{} })

	input := `["/a.png","","/a.png","javascript:alert(1)","  /b.png  ","ftp://x/y.png"]`
	require.NoError(t, UpdateHomeBannersByJSONString(input))

	assert.Equal(t, []string{"/a.png", "/b.png"}, HomeBanners)
}

func TestUpdateHomeBannersCapsCount(t *testing.T) {
	t.Cleanup(func() { HomeBanners = []string{} })

	items := make([]string, 0, MaxHomeBanners+5)
	for i := 0; i < MaxHomeBanners+5; i++ {
		items = append(items, "/banner-"+strconv.Itoa(i)+".png")
	}
	payload, err := Marshal(items)
	require.NoError(t, err)

	require.NoError(t, UpdateHomeBannersByJSONString(string(payload)))
	assert.Len(t, HomeBanners, MaxHomeBanners)
	assert.True(t, strings.HasPrefix(HomeBanners[0], "/banner-"))
}

func TestValidateHomeBannersJSON(t *testing.T) {
	assert.NoError(t, ValidateHomeBannersJSON(``))
	assert.NoError(t, ValidateHomeBannersJSON(`["/a.png"]`))
	assert.Error(t, ValidateHomeBannersJSON(`{"not":"an array"}`))
	assert.Error(t, ValidateHomeBannersJSON(`not-json`))
}
