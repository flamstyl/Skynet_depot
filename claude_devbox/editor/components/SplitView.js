/**
 * Split View Component
 * Handles resizable panels
 */

class SplitView {
    constructor(topSectionId, bottomSectionId, handleId) {
        this.topSection = document.getElementById(topSectionId);
        this.bottomSection = document.getElementById(bottomSectionId);
        this.handle = document.getElementById(handleId);
        this.isResizing = false;
        this.startY = 0;
        this.startTopHeight = 0;
        this.startBottomHeight = 0;

        this.init();
    }

    init() {
        this.handle.addEventListener('mousedown', (e) => this.startResize(e));
        document.addEventListener('mousemove', (e) => this.resize(e));
        document.addEventListener('mouseup', () => this.stopResize());
    }

    startResize(e) {
        this.isResizing = true;
        this.startY = e.clientY;
        this.startTopHeight = this.topSection.offsetHeight;
        this.startBottomHeight = this.bottomSection.offsetHeight;

        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
    }

    resize(e) {
        if (!this.isResizing) return;

        const deltaY = e.clientY - this.startY;
        const newTopHeight = this.startTopHeight + deltaY;
        const newBottomHeight = this.startBottomHeight - deltaY;

        const minHeight = 150;
        const totalHeight = this.startTopHeight + this.startBottomHeight;

        if (newTopHeight >= minHeight && newBottomHeight >= minHeight) {
            this.topSection.style.flex = `0 0 ${newTopHeight}px`;
            this.bottomSection.style.height = `${newBottomHeight}px`;
        }
    }

    stopResize() {
        if (this.isResizing) {
            this.isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    }
}

export default SplitView;
