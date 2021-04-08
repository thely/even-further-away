import { shuffle } from "../utils.js";
const { largestRect } = require("rect-scaler");
let p;

class ZoomLikeSpace { 
  constructor(s, dims) {
    p = s;
    this.blocks = [];
    this.keys = [];
    this.images = [];
    this.original = dims;
    this.gap = 5;
    this.blocking = false;
  }

  deleteAll() {
    this.blocks = [];
    this.keys = [];
    this.images = [];
  }

  addFrameToBlock(id, img) {
    if (this.blocks.length == 0) {
      return;
    }

    const index = this.keys.indexOf(id);
    this.blocks[index].seen = false;
    this.blocks[index].img = img;
  }
  
  drawBlocks(state) {
    for (let i = 0; i < this.blocks.length; i++) {
      // p.rect(
      //   this.blocks[i].x,
      //   this.blocks[i].y,
      //   this.blocks[i].w,
      //   this.blocks[i].h
      // );

      if ("img" in this.blocks[i] && !this.blocks[i].seen) {
        const block = this.blocks[i];
        const img = this.blocks[i].img;

        let dims;
        if ("zoom" in state) {
          if (state.zoom.style == "shifty") {
            dims = {
              x: block.x + p.random(state.zoom.deviance * -1, state.zoom.deviance),
              y: block.y + p.random(state.zoom.deviance * -1, state.zoom.deviance),
              w: block.w,
              h: block.h
            }
          } else {
            dims = block;
          }
        } else {
          dims = block;
        }

        p.tint(255, 255, 255, 80);
        p.image(img, dims.x, dims.y, dims.w, dims.h);
        this.blocks[i].seen = true;
      }
    }
  }

  generateBlocks(users) {
    const count = users.length;
    this.blocks = [];
    this.keys = users;

    const dims = largestRect(p.width, p.height, count, this.original.width, this.original.height);
    // console.log(dims);
    const blockW = (p.width - (this.gap * (dims.cols - 1))) / dims.cols;
    const blockH = blockW / this.original.width * this.original.height;

    // console.log("blockdims: ", blockW, blockH);
    const remainingTotal = this.getRemainingTotal(dims, count);
   
    const fullHeight = dims.rows * blockH + (this.gap * (dims.rows - 1));
    const topMargin = (p.height - fullHeight) / 2;
    // console.log("fullHeight: " + fullHeight + ", topMargin: " + topMargin);
    
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
        
        this.blocks.push({
          id: users[index],
          x: xVal, 
          y: yVal, 
          w: blockW, 
          h: blockH,
          seen: false
        });

        // this.order.push(index);

        index++;
        
        if (index >= count) {
          return;
        }
      }
    }

    // console.log(this.blocks);
    return this.blocks;
  }

  getRemainingTotal(dims, total) {
    const mod = ((dims.cols * dims.rows) % total);
    if (mod != 0) {
      return dims.cols - mod;  
    }
    return 0;
  }

  isRemainingBlock(dims, index) {
    if (dims.cols * dims.rows <= 2) {
      return false;
    }
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