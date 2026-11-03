const ctx = document.createElement('canvas').getContext('2d');
ctx.canvas.width = 10;
ctx.canvas.height = 10;
ctx.textBaseline = 'alphabetic';

export default {
  Java_pl_zb3_freej2me_bridge_graphics_CanvasFont_getTextWidth(lib, fontStr, text) {
    ctx.font = fontStr;
    return Math.round(ctx.measureText(text).width) | 0;
  },
  Java_pl_zb3_freej2me_bridge_graphics_CanvasFont_getFontMetrics(lib, fontStr, result) {
    ctx.font = fontStr;
    const tm = ctx.measureText("0");
    const ascent = Math.round(Math.abs(tm.fontBoundingBoxAscent || 11)) | 0;
    const descent = Math.round(Math.abs(tm.fontBoundingBoxDescent || 3)) | 0;
    result[0] = (ascent + descent) | 0;
    result[1] = ascent;
    return 0;
  }
};