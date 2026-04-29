.PHONY: generate build run install clean archive export-appstore export-direct

generate:
	xcodegen generate

build: generate
	xcodebuild -project FullScreenAlert.xcodeproj \
		-scheme FullScreenAlert \
		-configuration Release \
		-derivedDataPath build \
		CODE_SIGNING_ALLOWED=NO

run: build
	open build/Build/Products/Release/FullScreenAlert.app

install: build
	cp -r build/Build/Products/Release/FullScreenAlert.app /Applications/

# App Store / Direct 配布用アーカイブ
archive: generate
	xcodebuild -project FullScreenAlert.xcodeproj \
		-scheme FullScreenAlert \
		-configuration Release \
		-archivePath build/FullScreenAlert.xcarchive \
		archive

# App Store 用エクスポート
export-appstore: archive
	xcodebuild -exportArchive \
		-archivePath build/FullScreenAlert.xcarchive \
		-exportOptionsPlist ExportOptions-AppStore.plist \
		-exportPath build/export-appstore

# 直接配布用エクスポート（Developer ID署名 + 公証）
export-direct: archive
	xcodebuild -exportArchive \
		-archivePath build/FullScreenAlert.xcarchive \
		-exportOptionsPlist ExportOptions-Direct.plist \
		-exportPath build/export-direct

clean:
	rm -rf build/
	rm -rf FullScreenAlert.xcodeproj
