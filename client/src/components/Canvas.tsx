import React, { useRef, useState, useEffect } from 'react';
import "../css/Canvas.css";

interface Props {
  dimension: {
    width: number,
    height: number
  },
  canDraw: boolean,
  lineWidth: number,
  setLineWidth: any,
  lineColor: string,
  setLineColor: any,
  lineOpacity: number,
  setLineOpacity: any,
  selectedTool: string,
  socketConnection: any,
  playgroundDetails: any
}

export default function Canvas({ dimension, canDraw, lineWidth, setLineWidth, lineColor, setLineColor, lineOpacity, setLineOpacity, selectedTool, socketConnection, playgroundDetails }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const [user, setUser] = useState<any>();
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [coordinate, setCoordinate] = useState<number[]>([0, 0]);
  const [snapshot, setSnapshot] = useState<ImageData>();

  useEffect(() => {
    async function fetchData() {
      setUser(await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY as string) as any));
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.globalAlpha = lineOpacity;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;
        ctxRef.current = ctx;
      }
    }
    fetchData();
  }, [lineColor, lineOpacity, lineWidth]);
  useEffect(() => {
    async function fetchData() {
      if (socketConnection) {
        let snap: any, coordinate: number[];
        socketConnection.on("recieve-width-setting", async (payload: any) => {
          setLineWidth(payload.lineWidth);
        });
        socketConnection.on("recieve-opacity-setting", async (payload: any) => {
          setLineOpacity(payload.lineOpacity);
        });
        socketConnection.on("recieve-color-setting", async (payload: any) => {
          setLineColor(payload.lineColor);
        });
        socketConnection.on("recieve-start-drawing", async (payload: any) => {
          if (canvasRef.current && ctxRef.current) {
            coordinate = [(payload.xPercentage * dimension.width / 100), (payload.yPercentage * dimension.height / 100)];
            ctxRef.current.beginPath();
            ctxRef.current.moveTo(
              (payload.xPercentage * dimension.width / 100),
              (payload.yPercentage * dimension.height / 100)
            );
            setIsDrawing(true);
            snap = ctxRef.current.getImageData(0, 0, canvasRef.current?.width, canvasRef.current?.height);
          }
        });
        socketConnection.on("recieve-end-drawing", async (payload: any) => {
          if (ctxRef.current) {
            ctxRef.current.closePath();
            setIsDrawing(false);
          }
        });
        socketConnection.on("recieve-draw", async (payload: any) => {
          if (canvasRef.current && ctxRef.current) {
            ctxRef.current.putImageData(snap, 0, 0);
            if (payload.selectedTool === "freehand") {
              ctxRef.current.lineTo(
                (payload.xPercentage * dimension.width / 100),
                (payload.yPercentage * dimension.height / 100)
              );
              ctxRef.current.stroke();
            }
            else if (payload.selectedTool === "line") {
              ctxRef.current.beginPath();
              ctxRef.current.moveTo(
                coordinate[0],
                coordinate[1]
              );
              ctxRef.current.lineTo(
                (payload.xPercentage * dimension.width / 100),
                (payload.yPercentage * dimension.height / 100)
              );
              ctxRef.current.stroke();
            }
            else if (payload.selectedTool === "curve") {
              ctxRef.current.beginPath();
              let distance = Math.sqrt(Math.pow((coordinate[0] - (payload.xPercentage * dimension.width / 100)), 2) + Math.pow((coordinate[1] - (payload.yPercentage * dimension.height / 100)), 2));
              ctxRef.current.moveTo(coordinate[0], coordinate[1]);
              ctxRef.current.bezierCurveTo((coordinate[0] + (payload.xPercentage * dimension.width / 100)) / 2, (coordinate[1] + (payload.yPercentage * dimension.height / 100)) / 2 + distance, (coordinate[0] + (payload.xPercentage * dimension.width / 100)) / 2, (coordinate[1] + (payload.yPercentage * dimension.height / 100)) / 2 - distance, (payload.xPercentage * dimension.width / 100), (payload.yPercentage * dimension.height / 100));
              ctxRef.current.stroke();
            }
            else if (payload.selectedTool === "square") {
              ctxRef.current.beginPath();
              ctxRef.current.strokeRect(coordinate[0], coordinate[1], (payload.xPercentage * dimension.width / 100) - coordinate[0], (payload.xPercentage * dimension.width / 100) - coordinate[0]);
            }
            else if (payload.selectedTool === "rectangle") {
              ctxRef.current.beginPath();
              ctxRef.current.strokeRect(
                (payload.xPercentage * dimension.width / 100),
                (payload.yPercentage * dimension.height / 100),
                coordinate[0] - (payload.xPercentage * dimension.width / 100),
                coordinate[1] - (payload.yPercentage * dimension.height / 100)
              );
            }
            else if (payload.selectedTool === "triangle") {
              ctxRef.current.beginPath();
              ctxRef.current.moveTo(coordinate[0], coordinate[1]);
              ctxRef.current.lineTo((payload.xPercentage * dimension.width / 100), (payload.yPercentage * dimension.height / 100));
              ctxRef.current.lineTo(coordinate[0] * 2 - (payload.xPercentage * dimension.width / 100), (payload.yPercentage * dimension.height / 100));
              ctxRef.current.lineTo(coordinate[0], coordinate[1]);
              ctxRef.current.stroke();
            }
            else if (payload.selectedTool === "circle") {
              ctxRef.current.beginPath();
              let radius = Math.sqrt(Math.pow((coordinate[0] - (payload.xPercentage * dimension.width / 100)), 2) + Math.pow((coordinate[1] - (payload.yPercentage * dimension.height / 100)), 2));
              ctxRef.current.arc(coordinate[0], coordinate[1], radius, 0, 2 * Math.PI);
              ctxRef.current.stroke();
            }
            else if (payload.selectedTool === "ellipse") {
              ctxRef.current.beginPath();
              ctxRef.current.ellipse(
                coordinate[0],
                coordinate[1],
                Math.abs((payload.xPercentage * dimension.width / 100) - coordinate[0]),
                Math.abs((payload.yPercentage * dimension.height / 100) - coordinate[1]),
                0,
                0,
                2 * Math.PI
              );
              ctxRef.current.stroke();
            }
            else if (payload.selectedTool === "trapezium") {
              ctxRef.current.beginPath();
              ctxRef.current.moveTo(
                coordinate[0],
                coordinate[1]
              );
              ctxRef.current.lineTo(
                (payload.xPercentage * dimension.width / 100) - ((payload.yPercentage * dimension.height / 100) - coordinate[1]) / Math.tan(70 * Math.PI / 180),
                coordinate[1]
              );
              ctxRef.current.lineTo(
                (payload.xPercentage * dimension.width / 100),
                (payload.yPercentage * dimension.height / 100)
              );
              ctxRef.current.lineTo(
                coordinate[0] - ((payload.yPercentage * dimension.height / 100) - coordinate[1]) / Math.tan(70 * Math.PI / 180),
                (payload.yPercentage * dimension.height / 100)
              );
              ctxRef.current.lineTo(
                coordinate[0],
                coordinate[1]
              );
              ctxRef.current.stroke();
            }
          }
        });
        const spansToCheck: { left: number, right: number, y: number, direction: number }[] = [];
        const addSpan = (left: number, right: number, y: number, direction: number) => {
          spansToCheck.push({ left, right, y, direction });
        }
        const checkSpan = (left: number, right: number, y: number, direction: number, pixelData: { width: number, height: number, data: Uint32Array }, targetColor: number) => {
          let inSpan: boolean = false;
          let start = 0;
          let x: number;
          for (x = left; x < right; ++x) {
            const color: number = getPixel(pixelData, x, y);
            if (color === targetColor) {
              if (!inSpan) {
                inSpan = true;
                start = x;
              }
            } else {
              if (inSpan) {
                inSpan = false;
                addSpan(start, x - 1, y, direction);
              }
            }
          }
          if (inSpan) {
            inSpan = false;
            addSpan(start, x - 1, y, direction);
          }
        }
        const getPixel = (pixelData: { width: number, height: number, data: Uint32Array }, x: number, y: number) => {
          if (x < 0 || y < 0 || x >= pixelData.width || y >= pixelData.height) {
            return -1;
          } else {
            return pixelData.data[y * pixelData.width + x];
          }
        }
        const getOxCode = (lineColor: string) => {
          const OxCode = "0xFF".concat(lineColor.slice(5, 7), lineColor.slice(3, 5), lineColor.slice(1, 3));
          return Number(OxCode);
        };
        socketConnection.on("recieve-flood-fill", async (payload: any) => {
          if (ctxRef.current) {
            const x = Math.round(payload.xPercentage * dimension.width / 100), y = Math.round(payload.yPercentage * dimension.height / 100);
            const fillColor = getOxCode(lineColor);
            const imageData: ImageData = ctxRef.current.getImageData(0, 0, ctxRef.current.canvas.width, ctxRef.current.canvas.height);
            const pixelData: { width: number, height: number, data: Uint32Array } = {
              width: imageData.width,
              height: imageData.height,
              data: new Uint32Array(imageData.data.buffer),
            };
            const targetColor: number = getPixel(pixelData, x, y);
            if (targetColor !== fillColor) {
              addSpan(x, x, y, 0);
              while (spansToCheck.length > 0) {
                const { left, right, y, direction } = spansToCheck.pop()!;
                let l: number = left;
                for (; ;) {
                  --l;
                  const color: number = getPixel(pixelData, l, y);
                  if (color !== targetColor) {
                    break;
                  }
                }
                ++l;
                let r: number = right;
                for (; ;) {
                  ++r;
                  const color: number = getPixel(pixelData, r, y);
                  if (color !== targetColor) {
                    break;
                  }
                }
                const lineOffset: number = y * pixelData.width;
                pixelData.data.fill(fillColor, lineOffset + l, lineOffset + r);
                if (direction <= 0) {
                  checkSpan(l, r, y - 1, -1, pixelData, targetColor);
                } else {
                  checkSpan(l, left, y - 1, -1, pixelData, targetColor);
                  checkSpan(right, r, y - 1, -1, pixelData, targetColor);
                }
                if (direction >= 0) {
                  checkSpan(l, r, y + 1, +1, pixelData, targetColor);
                } else {
                  checkSpan(l, left, y + 1, +1, pixelData, targetColor);
                  checkSpan(right, r, y + 1, +1, pixelData, targetColor);
                }
              }
              ctxRef.current.putImageData(imageData, 0, 0);
            }
          }
        });
      }
    }
    fetchData();
  }, [socketConnection, lineColor]);


  const getDimensionPercentage = (x: number, y: number) => {
    const xPercentage = (x / dimension.width) * 100;
    const yPercentage = (y / dimension.height) * 100;
    return { xPercentage, yPercentage };
  };
  const drawLine = (x: number, y: number) => {
    if (ctxRef.current) {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(
        coordinate[0],
        coordinate[1]
      );
      ctxRef.current.lineTo(
        x,
        y
      );
      ctxRef.current.stroke();
    }
  };

  const drawCurve = (x: number, y: number) => {
    if (ctxRef.current) {
      ctxRef.current.beginPath();
      let distance = Math.sqrt(Math.pow((coordinate[0] - x), 2) + Math.pow((coordinate[1] - y), 2));
      ctxRef.current.moveTo(coordinate[0], coordinate[1]);
      ctxRef.current.bezierCurveTo((coordinate[0] + x) / 2, (coordinate[1] + y) / 2 + distance, (coordinate[0] + x) / 2, (coordinate[1] + y) / 2 - distance, x, y);
      ctxRef.current.stroke();
    }
  };

  const drawRectangle = (x: number, y: number) => {
    if (ctxRef.current) {
      ctxRef.current.beginPath();
      ctxRef.current.strokeRect(
        x,
        y,
        coordinate[0] - x,
        coordinate[1] - y
      );
    }
  }

  const drawSquare = (x: number, y: number) => {
    if (ctxRef.current) {
      ctxRef.current.beginPath();
      ctxRef.current.strokeRect(coordinate[0], coordinate[1], x - coordinate[0], x - coordinate[0]);
    }
  }

  const drawTriangle = (x: number, y: number) => {
    if (ctxRef.current) {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(coordinate[0], coordinate[1]);
      ctxRef.current.lineTo(x, y);
      ctxRef.current.lineTo(coordinate[0] * 2 - x, y);
      ctxRef.current.lineTo(coordinate[0], coordinate[1]);
      ctxRef.current.stroke();
    }
  };

  const drawCircle = (x: number, y: number) => {
    if (ctxRef.current) {
      ctxRef.current.beginPath();
      let radius = Math.sqrt(Math.pow((coordinate[0] - x), 2) + Math.pow((coordinate[1] - y), 2));
      ctxRef.current.arc(coordinate[0], coordinate[1], radius, 0, 2 * Math.PI);
      ctxRef.current.stroke();
    }
  };

  const drawEllipse = (x: number, y: number) => {
    if (ctxRef.current) {
      ctxRef.current.beginPath();
      ctxRef.current.ellipse(
        coordinate[0],
        coordinate[1],
        Math.abs(x - coordinate[0]),
        Math.abs(y - coordinate[1]),
        0,
        0,
        2 * Math.PI
      );

      ctxRef.current.stroke();
    }
  };

  const drawTrapezium = (x: any, y: any) => {
    if (ctxRef.current) {
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(
        coordinate[0],
        coordinate[1]
      );
      ctxRef.current.lineTo(
        x - (y - coordinate[1]) / Math.tan(70 * Math.PI / 180),
        coordinate[1]
      );
      ctxRef.current.lineTo(
        x,
        y
      );
      ctxRef.current.lineTo(
        coordinate[0] - (y - coordinate[1]) / Math.tan(70 * Math.PI / 180),
        y
      );
      ctxRef.current.lineTo(
        coordinate[0],
        coordinate[1]
      );


      ctxRef.current.stroke();
    }
  };
  const startDrawing = (e: any) => {
    if (canvasRef.current && ctxRef.current && canDraw === true) {
      const { xPercentage, yPercentage } = getDimensionPercentage(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      const payload = { xPercentage: xPercentage, yPercentage: yPercentage, owner: playgroundDetails.owner, doodleId: user.doodleId, playgroundId: playgroundDetails.playgroundId };
      socketConnection.emit("send-start-drawing", payload);
      setCoordinate([e.nativeEvent.offsetX, e.nativeEvent.offsetY]);
      ctxRef.current.beginPath();
      ctxRef.current.moveTo(
        e.nativeEvent.offsetX,
        e.nativeEvent.offsetY
      );
      setIsDrawing(true);
      setSnapshot(ctxRef.current.getImageData(0, 0, canvasRef.current?.width, canvasRef.current?.height));
    }
  };
  const endDrawing = () => {
    if (canvasRef.current && ctxRef.current && canDraw === true) {
      const payload = { owner: playgroundDetails.owner, doodleId: user.doodleId, playgroundId: playgroundDetails.playgroundId };
      socketConnection.emit("send-end-drawing", payload);
      ctxRef.current.closePath();
      setIsDrawing(false);
    }
  }
  const draw = (e: any) => {
    if (canvasRef.current && ctxRef.current && snapshot && canDraw === true) {
      if (!isDrawing) {
        return;
      }
      const { xPercentage, yPercentage } = getDimensionPercentage(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      const payload = { xPercentage: xPercentage, yPercentage: yPercentage, owner: playgroundDetails.owner, doodleId: user.doodleId, playgroundId: playgroundDetails.playgroundId, selectedTool: selectedTool };
      socketConnection.emit("send-draw", payload);
      ctxRef.current.putImageData(snapshot, 0, 0);
      if (selectedTool === "freehand") {
        ctxRef.current.lineTo(
          e.nativeEvent.offsetX,
          e.nativeEvent.offsetY
        );

        ctxRef.current.stroke();
      }
      else if (selectedTool === "line") {
        drawLine(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }
      else if (selectedTool === "curve") {
        drawCurve(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }
      else if (selectedTool === "square") {
        drawSquare(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }
      else if (selectedTool === "rectangle") {
        drawRectangle(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }
      else if (selectedTool === "triangle") {
        drawTriangle(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }
      else if (selectedTool === "circle") {
        drawCircle(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }
      else if (selectedTool === "ellipse") {
        drawEllipse(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }
      else if (selectedTool === "trapezium") {
        drawTrapezium(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      }
    }
  };

  const spansToCheck: { left: number, right: number, y: number, direction: number }[] = [];
  const addSpan = (left: number, right: number, y: number, direction: number) => {
    spansToCheck.push({ left, right, y, direction });
  }
  const checkSpan = (left: number, right: number, y: number, direction: number, pixelData: { width: number, height: number, data: Uint32Array }, targetColor: number) => {
    let inSpan: boolean = false;
    let start = 0;
    let x: number;
    for (x = left; x < right; ++x) {
      const color: number = getPixel(pixelData, x, y);
      if (color === targetColor) {
        if (!inSpan) {
          inSpan = true;
          start = x;
        }
      } else {
        if (inSpan) {
          inSpan = false;
          addSpan(start, x - 1, y, direction);
        }
      }
    }
    if (inSpan) {
      inSpan = false;
      addSpan(start, x - 1, y, direction);
    }
  }
  const getPixel = (pixelData: { width: number, height: number, data: Uint32Array }, x: number, y: number) => {
    if (x < 0 || y < 0 || x >= pixelData.width || y >= pixelData.height) {
      return -1;
    } else {
      return pixelData.data[y * pixelData.width + x];
    }
  }
  const getOxCode = (lineColor: string) => {
    const OxCode = "0xFF".concat(lineColor.slice(5, 7), lineColor.slice(3, 5), lineColor.slice(1, 3));
    return Number(OxCode);
  };
  const floodFill = (e: any) => {
    if (ctxRef.current && selectedTool === "floodfill" && canDraw === true) {
      const { xPercentage, yPercentage } = getDimensionPercentage(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      const payload = { xPercentage: xPercentage, yPercentage: yPercentage, owner: playgroundDetails.owner, doodleId: user.doodleId, playgroundId: playgroundDetails.playgroundId };
      socketConnection.emit("send-flood-fill", payload);
      const x = e.nativeEvent.offsetX, y = e.nativeEvent.offsetY;
      const fillColor = getOxCode(lineColor);
      const imageData: ImageData = ctxRef.current.getImageData(0, 0, ctxRef.current.canvas.width, ctxRef.current.canvas.height);
      const pixelData: { width: number, height: number, data: Uint32Array } = {
        width: imageData.width,
        height: imageData.height,
        data: new Uint32Array(imageData.data.buffer),
      };
      const targetColor: number = getPixel(pixelData, x, y);
      if (targetColor !== fillColor) {
        addSpan(x, x, y, 0);
        while (spansToCheck.length > 0) {
          const { left, right, y, direction } = spansToCheck.pop()!;
          let l: number = left;
          for (; ;) {
            --l;
            const color: number = getPixel(pixelData, l, y);
            if (color !== targetColor) {
              break;
            }
          }
          ++l;
          let r: number = right;
          for (; ;) {
            ++r;
            const color: number = getPixel(pixelData, r, y);
            if (color !== targetColor) {
              break;
            }
          }
          const lineOffset: number = y * pixelData.width;
          pixelData.data.fill(fillColor, lineOffset + l, lineOffset + r);
          if (direction <= 0) {
            checkSpan(l, r, y - 1, -1, pixelData, targetColor);
          } else {
            checkSpan(l, left, y - 1, -1, pixelData, targetColor);
            checkSpan(right, r, y - 1, -1, pixelData, targetColor);
          }
          if (direction >= 0) {
            checkSpan(l, r, y + 1, +1, pixelData, targetColor);
          } else {
            checkSpan(l, left, y + 1, +1, pixelData, targetColor);
            checkSpan(right, r, y + 1, +1, pixelData, targetColor);
          }
        }
        ctxRef.current.putImageData(imageData, 0, 0);
      }
    }
  }

  return (
    <>
      <canvas
        id="drawingCanvas"
        onClick={floodFill}
        onMouseDown={startDrawing}
        onMouseUp={endDrawing}
        onMouseMove={draw}
        width={dimension.width} height={dimension.height}
        ref={canvasRef}>
      </canvas>
    </>
  )
}
