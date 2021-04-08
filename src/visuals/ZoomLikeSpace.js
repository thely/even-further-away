const { largestRect } = require("rect-scaler");
let p;

class ZoomLikeSpace { 
  constructor(s, dims) {
    p = s;
    this.blocks = [];
    this.original = dims;
    this.gap = 5;
  }

  spaceBlocks(count) {
    this.blocks = [];

    const dims = largestRect(p.width, p.height, count, this.original.width, this.original.height);
    const blockW = (p.width - (this.gap * (dims.cols - 1))) / dims.cols;
    const blockH = blockW / this.original.width * this.original.height;
    const remainingTotal = this.getRemainingTotal(dims, count);
   
    const fullHeight = dims.rows * blockH + (this.gap * (dims.rows - 1));
    const topMargin = (p.height - fullHeight) / 2;
    
    let index = 0;
    for (let i = 0; i < dims.rows; i++) {
      let yVal = blockH * i + this.gap * i + topMargin;
          
      for (let j = 0; j < dims.cols; j++) {
        let xVal;
  
        if (this.isRemainingBlock(dims, index)) {
          xVal = this.leftoverBlock(index, remainingTotal, count, blockW);
        } else {
          xVal = blockW * j + this.gap * j;  
        }
        
        this.blocks.push([xVal, yVal, blockW, blockH]);
        index++;
        
        if (index >= count) {
          return;
        }
      }
    }

    return this.blocks;
  }
  
  drawBlocks() {
    for (let i = 0; i < this.blocks.length; i++) {
      p.rect(
        this.blocks[i][0],
        this.blocks[i][1],
        this.blocks[i][2],
        this.blocks[i][3]
      );
    }
  }

  getRemainingTotal(dims, total) {
    const mod = ((dims.cols * dims.rows) % total);
    if (mod != 0) {
      return dims.cols - mod;  
    }
    return 0;
  }

  isRemainingBlock(dims, index) {
    return dims.cols * dims.rows - index < dims.cols + 1;
  }

  leftoverBlock(index, remaining, total, blockW) {
    let i = remaining - (total - index);
    const left = remaining * blockW + this.gap;
    const margin = (p.width - left) / 2;
    
    let xVal = margin + (blockW * i) + this.gap * i;
    if (remaining == 1) {
      xVal += this.gap / 2;
    }
    
    return xVal;
  }
}

export default ZoomLikeSpace;