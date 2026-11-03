const ctx = document.createElement('canvas').getContext('2d');
ctx.canvas.width = 10;
ctx.canvas.height = 10;

function createOffscreenCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, w | 0);
  c.height = Math.max(1, h | 0);
  return c;
}

function safeCloseBitmap(bmp) {
  if (bmp && typeof bmp.close === 'function') {
    try {
      bmp.close();
    } catch (e) {}
  }
}

function transformBitmapOrCanvas(src, sx, sy, sw, sh, a90, mirror) {
  const swap = a90 & 1;
  const outCanvas = createOffscreenCanvas(swap ? sh : sw, swap ? sw : sh);
  const outCtx = outCanvas.getContext('2d');
  outCtx.imageSmoothingEnabled = false;

  if (a90 === 0 && !mirror) {
    outCtx.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
    return outCanvas;
  }

  outCtx.save();
  outCtx.translate(outCanvas.width / 2, outCanvas.height / 2);
  if (mirror) {
    outCtx.scale(swap ? 1 : -1, swap ? -1 : 1);
  }
  if (a90) {
    outCtx.rotate(a90 * 0.5 * Math.PI);
  }
  if (swap) {
    outCtx.translate(-outCanvas.height / 2, -outCanvas.width / 2);
  } else {
    outCtx.translate(-outCanvas.width / 2, -outCanvas.height / 2);
  }
  outCtx.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
  outCtx.restore();

  return outCanvas;
}

function castToUint8Clamped(int8) {
  return new Uint8ClampedArray(int8.buffer, int8.byteOffset, int8.byteLength);
}

function castToInt8(uint8) {
  return new Int8Array(uint8.buffer, uint8.byteOffset, uint8.byteLength);
}

const CanvasImage = {
  Java_pl_zb3_freej2me_bridge_graphics_CanvasImage_bitmapFromColor(lib, width, height, r, g, b, a) {
    const outCanvas = createOffscreenCanvas(width, height);
    const outCtx = outCanvas.getContext('2d');
    outCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    outCtx.fillRect(0, 0, width, height);
    return outCanvas;
  },
  async Java_pl_zb3_freej2me_bridge_graphics_CanvasImage_bitmapFromBytes(lib, bytes, result) {
    const blob = new Blob([bytes], { type: 'image/png' });

    try {
      const bitmap = await createImageBitmap(blob);
      result[0] = bitmap.width;
      result[1] = bitmap.height;
      return bitmap;
    } catch (e) {
      return null;
    }
  },
  Java_pl_zb3_freej2me_bridge_graphics_CanvasImage_transformBitmap(lib, bmp, sx, sy, sw, sh, a90, mirror) {
    return transformBitmapOrCanvas(bmp, sx, sy, sw, sh, a90, mirror);
  },
  Java_pl_zb3_freej2me_bridge_graphics_CanvasImage_bitmapFromRGBAData(lib, rgba, width, height) {
    const outCanvas = createOffscreenCanvas(width, height);
    const outCtx = outCanvas.getContext('2d');
    const imageData = new ImageData(castToUint8Clamped(rgba), width, height);
    outCtx.putImageData(imageData, 0, 0);
    return outCanvas;
  },
  Java_pl_zb3_freej2me_bridge_graphics_CanvasImage_getRGBAFromBitmap(lib, bmp, sx, sy, width, height) {
    ctx.canvas.width = width;
    ctx.canvas.height = height;
    ctx.drawImage(bmp, sx, sy, width, height, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    return castToInt8(imageData.data);
  },
  Java_pl_zb3_freej2me_bridge_graphics_CanvasImage_setRGBAToBitmap(lib, bmp, rgbaData, x, y, width, height) {
    const outCanvas = createOffscreenCanvas(bmp.width, bmp.height);
    const outCtx = outCanvas.getContext('2d');
    outCtx.drawImage(bmp, 0, 0);
    const imageData = new ImageData(castToUint8Clamped(rgbaData), width, height);
    outCtx.putImageData(imageData, x, y);
    safeCloseBitmap(bmp);
    return outCanvas;
  },
  Java_pl_zb3_freej2me_bridge_graphics_CanvasImage_closeBitmap(lib, bmp) {
    safeCloseBitmap(bmp);
  }
};

function roundRectPath(ctx, x, y, width, height, arcWidth, arcHeight) {
  const radiusX = arcWidth / 2;
  const radiusY = arcHeight / 2;

  ctx.beginPath();
  ctx.moveTo(x + radiusX, y);
  ctx.lineTo(x + width - radiusX, y);
  ctx.ellipse(x + width - radiusX, y + radiusY, radiusX, radiusY, 0, -Math.PI / 2, 0);
  ctx.lineTo(x + width, y + height - radiusY);
  ctx.ellipse(x + width - radiusX, y + height - radiusY, radiusX, radiusY, 0, 0, Math.PI / 2);
  ctx.lineTo(x + radiusX, y + height);
  ctx.ellipse(x + radiusX, y + height - radiusY, radiusX, radiusY, 0, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + radiusY);
  ctx.ellipse(x + radiusX, y + radiusY, radiusX, radiusY, 0, Math.PI, -Math.PI / 2);
  ctx.closePath();
}

function setColor(ctx, r, g, b, a) {
  const style = a === 255 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a / 255})`;
  ctx.fillStyle = style;
  ctx.strokeStyle = style;
}

const CanvasGraphics = {
  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_getRGBAFromCtx(lib, ctx, sx, sy, width, height) {
    const imageData = ctx.getImageData(sx, sy, width, height);
    return castToInt8(imageData.data);
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_drawRGBAData(lib, targetCtx, rgba, width, height, x, y, blend) {
    if (blend) {
      ctx.canvas.width = width;
      ctx.canvas.height = height;
      ctx.putImageData(new ImageData(castToUint8Clamped(rgba), width, height), 0, 0);
      targetCtx.drawImage(ctx.canvas, x, y);
    } else {
      targetCtx.putImageData(new ImageData(castToUint8Clamped(rgba), width, height), x, y);
    }
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_bitmapToCanvasCtx(lib, bmp) {
    const newCtx = document.createElement('canvas').getContext('2d');
    newCtx.canvas.width = bmp.width;
    newCtx.canvas.height = bmp.height;
    newCtx.imageSmoothingEnabled = false;
    newCtx.drawImage(bmp, 0, 0);
    safeCloseBitmap(bmp);
    return newCtx;
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_getCanvasFromCtx(lib, ctx) {
    return ctx.canvas;
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_createCanvasCtx(lib, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const newCtx = canvas.getContext('2d');
    newCtx.imageSmoothingEnabled = false;
    newCtx.textBaseline = 'alphabetic';
    newCtx.textAlign = 'left';
    newCtx.save();
    return newCtx;
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_setFullState(lib, ctx, fontStr, dotted, r, g, b, a, clipX, clipY, clipWidth, clipHeight, translateX, translateY) {
    ctx.restore();
    ctx.save();

    ctx.font = fontStr;
    if (dotted) {
      ctx.setLineDash([2, 2]);
    }

    setColor(ctx, r, g, b, a);

    if (clipX !== 0 || clipY !== 0 || clipWidth !== ctx.canvas.width || clipHeight !== ctx.canvas.height) {
      ctx.beginPath();
      ctx.rect(clipX, clipY, clipWidth, clipHeight);
      ctx.clip();
    }

    if (translateX !== 0 || translateY !== 0) {
      ctx.translate(translateX, translateY);
    }
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_setColor(lib, ctx, r, g, b, a) {
    setColor(ctx, r, g, b, a);
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_setFont(lib, ctx, fontStr) {
    ctx.font = fontStr;
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_setDotted(lib, ctx, dotted) {
    ctx.setLineDash(dotted ? [2, 2] : []);
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_applyTranslate(lib, ctx, x, y) {
    ctx.translate(x, y);
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_putRGBAData(lib, ctx, rgbaData, x, y, width, height) {
    const imageData = new ImageData(castToUint8Clamped(rgbaData), width, height);
    ctx.putImageData(imageData, x, y);
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_drawArc(lib, ctx, x, y, width, height, start, arc) {
    ctx.beginPath();
    ctx.ellipse(x + width / 2 + 0.5, y + height / 2 + 0.5, width / 2, height / 2, 0, -start * Math.PI / 180, -start * Math.PI / 180 - arc * Math.PI / 180, arc > 0);
    ctx.stroke();
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_fillArc(lib, ctx, x, y, width, height, start, arc) {
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y + height / 2);
    ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, -start * Math.PI / 180, -start * Math.PI / 180 - arc * Math.PI / 180, arc > 0);
    ctx.moveTo(x + width / 2, y + height / 2);
    ctx.fill();
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_drawRect(lib, ctx, x, y, width, height) {
    width = width || 1;
    height = height || 1;
    ctx.strokeRect(x + 0.5, y + 0.5, width, height);
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_clearRect(lib, ctx, x, y, width, height) {
    ctx.clearRect(x, y, width, height);
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_fillRect(lib, ctx, x, y, width, height) {
    ctx.fillRect(x, y, width, height);
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_drawRoundRect(lib, ctx, x, y, width, height, arcWidth, arcHeight) {
    roundRectPath(ctx, x + 0.5, y + 0.5, width, height, arcWidth, arcHeight);
    ctx.stroke();
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_fillRoundRect(lib, ctx, x, y, width, height, arcWidth, arcHeight) {
    roundRectPath(ctx, x, y, width, height, arcWidth, arcHeight);
    ctx.fill();
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_drawLine(lib, ctx, x1, y1, x2, y2) {
    if (y1 === y2) {
      y1 = y1 + 0.5;
      y2 = y2 + 0.5;
    } else if (x1 === x2) {
      x1 = x1 + 0.5;
      x2 = x2 + 0.5;
    }
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_drawPolygon(lib, ctx, x, y, n) {
    ctx.beginPath();
    ctx.moveTo(x[0] + 0.5, y[0] + 0.5);
    for (let t = 1; t < n; t++) {
      ctx.lineTo(x[t] + 0.5, y[t] + 0.5);
    }
    ctx.closePath();
    ctx.stroke();
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_fillPolygon(lib, ctx, x, y, n, useSharpFillHack) {
    ctx.beginPath();
    ctx.moveTo(x[0], y[0]);
    for (let t = 1; t < n; t++) {
      ctx.lineTo(x[t], y[t]);
    }
    ctx.closePath();
    ctx.fill();
    if (useSharpFillHack) {
      ctx.fill();
    }
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_drawText(lib, ctx, text, x, y) {
    ctx.fillText(text, x, y);
  },

  Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_drawImage2(lib, ctx, source, sx, sy, dx, dy, widthAndTransform, height, flipY, withAlpha) {
    if (!source) return;
    const transform = (widthAndTransform >>> 24) & 7;
    const width = widthAndTransform & 0xFFFFFF;
    if (width <= 0 || height <= 0) return;

    if (!withAlpha) {
      ctx.save();
      ctx.fillStyle = 'black';
      ctx.fillRect(dx, dy, (transform >= 4) ? height : width, (transform >= 4) ? width : height);
      ctx.restore();
    }

    if (transform === 0 && !flipY) {
      ctx.drawImage(source, sx, sy, width, height, dx, dy, width, height);
    } else if (transform === 2 && !flipY) {
      // Fast hardware GPU path for Sprite.TRANS_MIRROR (99% of flipped sprites in KPAH)
      ctx.save();
      ctx.translate(dx + width, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(source, sx, sy, width, height, 0, 0, width, height);
      ctx.restore();
    } else if (transform === 0 && flipY) {
      ctx.save();
      ctx.translate(dx, dy + height);
      ctx.scale(1, -1);
      ctx.drawImage(source, sx, sy, width, height, 0, 0, width, height);
      ctx.restore();
    } else {
      let a90 = 0;
      let mirror = false;
      switch (transform) {
        case 1: a90 = 2; mirror = true; break;
        case 2: a90 = 0; mirror = true; break;
        case 3: a90 = 2; mirror = false; break;
        case 4: a90 = 3; mirror = true; break;
        case 5: a90 = 1; mirror = false; break;
        case 6: a90 = 3; mirror = false; break;
        case 7: a90 = 1; mirror = true; break;
      }
      const swap = a90 & 1;
      const dw = swap ? height : width;
      const dh = swap ? width : height;
      ctx.save();
      ctx.translate(dx + dw / 2, dy + dh / 2);
      if (mirror) {
        ctx.scale(swap ? 1 : -1, swap ? -1 : 1);
      }
      if (a90) {
        ctx.rotate(a90 * 0.5 * Math.PI);
      }
      if (swap) {
        ctx.translate(-dh / 2, -dw / 2);
      } else {
        ctx.translate(-dw / 2, -dh / 2);
      }
      ctx.drawImage(source, sx, sy, width, height, 0, 0, width, height);
      ctx.restore();
    }
  },

  async Java_pl_zb3_freej2me_bridge_graphics_CanvasGraphics_encode(lib, ctx, type) {
    const canvas = ctx.canvas;
    const buffer = await new Promise(resolve => {
      canvas.toBlob(
        async (blob) => {
          resolve(blob ? (await blob.arrayBuffer()) : null);
        },
        type,
        0.9
      );
    });
    if (buffer) {
      return new Int8Array(buffer);
    }
  }
};

export default {
  ...CanvasImage,
  ...CanvasGraphics,
  Java_pl_zb3_freej2me_bridge_graphics_Utils_getCanvasFromCtx(lib, ctx) {
    return ctx.canvas;
  }
};
