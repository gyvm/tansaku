DESIGN_DIR := design-collection

.PHONY: help design-install design-dev design-build

help:
	@echo "Available targets:"
	@echo "  make design-install  Install dependencies for design-collection"
	@echo "  make design-dev      Start design-collection dev server"
	@echo "  make design-build    Build design-collection"

design-install:
	cd $(DESIGN_DIR) && npm install

design-dev:
	cd $(DESIGN_DIR) && npm run dev

design-build:
	cd $(DESIGN_DIR) && npm run build
