"use client";
import React, { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { Marker } from "@/lib/simplifyMarkers";

const materialCache = new Map();

interface PolygonProps {
  markers: Marker[];
  localization?: {
    position: {
      x: number;
      y: number;
      z: number;
    };
  };
  distanceThreshold?: number; // 控制LOD切换的距离阈值
  rdpEpsilonLevels?: [number, number, number]; // 控制RDP算法的精度，值越小精度越高
}

const Polygon: React.FC<PolygonProps> = ({
  markers,
  localization,
  distanceThreshold = 50, // 默认50单位距离触发LOD
  rdpEpsilonLevels = [0, 0.1, 0.3], // 默认RDP精度参数：[LOD0无简化, LOD1轻度简化, LOD2中等简化]
}) => {
  const { camera, invalidate } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const [currentLODs, setCurrentLODs] = useState<number[]>([]);

  // 根据颜色获取或创建材质（不透明，提高性能）
  const getMaterial = (r = 1, g = 0, b = 0) => {
    const key = `${r}-${g}-${b}`;
    if (!materialCache.has(key)) {
      materialCache.set(
        key,
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(r, g, b),
          side: THREE.DoubleSide,
          // 移除透明属性，提高渲染性能
        })
      );
    }
    return materialCache.get(key);
  };

  // 创建拉伸几何体
  const createExtrudedGeometry = (points: THREE.Vector2[]) => {
    try {
      const shape = new THREE.Shape(points);
      const extrudeSettings = {
        steps: 1,
        depth: 0.7, // 与车辆高度相匹配的适当拉伸深度
        bevelEnabled: false,
      };
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    } catch (error) {
      console.error("创建几何体失败:", error);
      // 返回一个小的平面几何体作为失败后的替代
      return new THREE.PlaneGeometry(1, 1);
    }
  };

  // 点到线段的垂直距离（用于RDP算法）
  const perpendicularDistance = (
    point: THREE.Vector2,
    lineStart: THREE.Vector2,
    lineEnd: THREE.Vector2
  ): number => {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;

    // 处理特殊情况：线段实际上是一个点
    if (dx === 0 && dy === 0) {
      return point.distanceTo(lineStart);
    }

    // 计算点到线的投影比例
    const t =
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
      (dx * dx + dy * dy);

    let closestPoint: THREE.Vector2;

    // 确定线段上最近的点
    if (t < 0) {
      closestPoint = lineStart;
    } else if (t > 1) {
      closestPoint = lineEnd;
    } else {
      closestPoint = new THREE.Vector2(
        lineStart.x + t * dx,
        lineStart.y + t * dy
      );
    }

    // 计算点到最近点的距离
    return point.distanceTo(closestPoint);
  };

  // Ramer-Douglas-Peucker算法实现
  const rdp = (points: THREE.Vector2[], epsilon: number): THREE.Vector2[] => {
    if (points.length <= 2 || epsilon <= 0) {
      return points; // 基本情况：少于3个点时无需简化
    }

    let maxDistance = 0;
    let maxIndex = 0;
    const end = points.length - 1;

    // 寻找离首尾连线最远的点
    for (let i = 1; i < end; i++) {
      const distance = perpendicularDistance(points[i], points[0], points[end]);

      if (distance > maxDistance) {
        maxIndex = i;
        maxDistance = distance;
      }
    }

    // 如果最大距离大于阈值，则需要分治处理
    if (maxDistance > epsilon) {
      // 递归处理前后两个子序列
      const firstPart = rdp(points.slice(0, maxIndex + 1), epsilon);
      const secondPart = rdp(points.slice(maxIndex), epsilon);

      // 合并两个子序列（去重连接点）
      return firstPart.slice(0, firstPart.length - 1).concat(secondPart);
    } else {
      // 如果最大距离小于阈值，则这段曲线可以用直线段表示
      return [points[0], points[end]];
    }
  };

  // 确保多边形闭合且有足够顶点
  const ensureValidPolygon = (points: THREE.Vector2[]): THREE.Vector2[] => {
    if (points.length === 0) {
      // 极端情况：没有点时创建一个小三角形作为替代
      return [
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.1, 0),
        new THREE.Vector2(0, 0.1),
      ];
    }

    if (points.length < 3) {
      // 点不足时，复制已有点形成三角形
      const existingPoints = [...points];
      while (existingPoints.length < 3) {
        const offset = 0.1 * existingPoints.length;
        existingPoints.push(
          new THREE.Vector2(
            existingPoints[0].x + offset,
            existingPoints[0].y + offset
          )
        );
      }
      return existingPoints;
    }

    // 确保多边形闭合（首尾点相同）
    const result = [...points];
    if (!result[0].equals(result[result.length - 1])) {
      result.push(result[0].clone());
    }

    return result;
  };

  // 用RDP算法简化点序列
  const simplifyPointsWithRDP = (
    points: THREE.Vector2[],
    detailLevel: number
  ): THREE.Vector2[] => {
    // 对于LOD0，不进行简化
    if (detailLevel === 0 || points.length <= 3) return points;

    // 获取当前详细度对应的epsilon值
    const epsilon =
      rdpEpsilonLevels[detailLevel] ||
      rdpEpsilonLevels[rdpEpsilonLevels.length - 1];

    // 如果epsilon为0，则不进行简化
    if (epsilon <= 0) return points;

    // 应用RDP算法简化点序列
    let simplified = rdp(points, epsilon);

    // 确保简化后的多边形是有效的
    return ensureValidPolygon(simplified);
  };

  // 预先处理并缓存几何体数据
  const polygonData = useMemo(() => {
    if (!markers || !localization) return [];

    return markers
      .map((marker) => {
        // 转换点坐标到车辆相对坐标系
        const points = marker.points?.map((point) => {
          const x = point.x - (localization?.position.x || 0);
          const z = point.z - (localization?.position.z || 0);
          return new THREE.Vector2(x, z);
        });

        if (!points || points.length < 3) return null;

        // 确保点序列形成有效的多边形
        const validPoints = ensureValidPolygon(points);

        // 计算中心点（用于LOD计算和视锥体剔除）
        const center = new THREE.Vector3();
        validPoints.forEach((p) => center.add(new THREE.Vector3(p.x, 0, p.y)));
        center.divideScalar(validPoints.length);

        // 创建LOD0的几何体（无简化）
        const lod0Geometry = createExtrudedGeometry(validPoints);

        // 计算准确的包围球，用于视锥体剔除
        lod0Geometry.computeBoundingSphere();
        const boundingSphere =
          lod0Geometry.boundingSphere?.clone() || new THREE.Sphere(center, 5); // 备用半径

        // 准备不同LOD级别的几何体
        const lodGeometries = [
          { level: 0, geometry: lod0Geometry },
          {
            level: 1,
            geometry: createExtrudedGeometry(
              simplifyPointsWithRDP(validPoints, 1)
            ),
          },
          {
            level: 2,
            geometry: createExtrudedGeometry(
              simplifyPointsWithRDP(validPoints, 2)
            ),
          },
        ];

        return {
          center,
          boundingSphere,
          lodGeometries,
          color: {
            r: marker.color?.r || 1,
            g: marker.color?.g || 0,
            b: marker.color?.b || 0,
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [markers, localization, rdpEpsilonLevels]); // 添加rdpEpsilonLevels作为依赖项

  // 每帧更新LOD
  useFrame(() => {
    if (!groupRef.current || polygonData.length === 0) return;

    // 创建视锥体
    const projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    const frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(projScreenMatrix);

    // 计算新的LOD级别
    const newLODs = polygonData.map((item) => {
      // 使用准确计算的包围球进行视锥体剔除
      const boundingSphere = item.boundingSphere.clone();
      boundingSphere.center.add(item.center);

      const isVisible = frustum.intersectsSphere(boundingSphere);

      if (!isVisible) return -1; // 不可见

      // 计算距离相机的距离，用于LOD选择
      const distance = camera.position.distanceTo(item.center);

      // 根据距离决定LOD级别
      if (distance < distanceThreshold) {
        return 0; // 近距离: 最高精度
      } else if (distance < distanceThreshold * 2) {
        return 1; // 中等距离: 中等精度
      } else {
        return 2; // 远距离: 最低精度
      }
    });

    // 高效比较数组，避免使用JSON.stringify
    let changed = false;
    if (newLODs.length !== currentLODs.length) {
      changed = true;
    } else {
      for (let i = 0; i < newLODs.length; i++) {
        if (newLODs[i] !== currentLODs[i]) {
          changed = true;
          break;
        }
      }
    }

    if (changed) {
      setCurrentLODs(newLODs);
      invalidate(); // 请求重新渲染
    }
  });

  // 渲染最终的多边形
  const renderPolygons = useMemo(() => {
    if (currentLODs.length === 0) {
      // 第一次渲染时，使用默认LOD级别0（最高精度）
      return polygonData
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .map((item, index) => {
          try {
            if (!item.lodGeometries || !item.lodGeometries[0]) {
              console.warn(`多边形数据缺失几何体信息，索引: ${index}`);
              return null;
            }
            return (
              <mesh
                key={index}
                geometry={item.lodGeometries[0].geometry}
                material={getMaterial(item.color.r, item.color.g, item.color.b)}
              />
            );
          } catch (error) {
            console.error(`渲染多边形出错，索引: ${index}`, error);
            return null;
          }
        })
        .filter(Boolean);
    }

    return polygonData
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .map((item, index) => {
        try {
          const lodLevel = currentLODs[index];

          // 检查LOD级别是否有效
          if (lodLevel === undefined || lodLevel === -1) return null;

          // 确保几何体数据存在
          if (!item.lodGeometries || item.lodGeometries.length === 0) {
            console.warn(`多边形缺失几何体数据，索引: ${index}`);
            return null;
          }

          // 获取合适的LOD几何体
          const lodIndex = Math.min(lodLevel, item.lodGeometries.length - 1);
          const lodItem = item.lodGeometries[lodIndex];

          if (!lodItem || !lodItem.geometry) {
            console.warn(
              `多边形LOD几何体缺失，索引: ${index}, LOD级别: ${lodLevel}`
            );
            return null;
          }

          return (
            <mesh
              key={index}
              geometry={lodItem.geometry}
              material={getMaterial(item.color.r, item.color.g, item.color.b)}
            />
          );
        } catch (error) {
          console.error(`渲染多边形出错，索引: ${index}`, error);
          return null;
        }
      })
      .filter(Boolean);
  }, [polygonData, currentLODs]);

  // 组件卸载时释放资源
  React.useEffect(() => {
    return () => {
      polygonData.forEach((item) => {
        item.lodGeometries.forEach((lodItem) => {
          if (lodItem.geometry) {
            lodItem.geometry.dispose();
          }
        });
      });

      materialCache.forEach((material) => {
        material.dispose();
      });
      materialCache.clear();
    };
  }, [polygonData]);

  return <group ref={groupRef}>{renderPolygons}</group>;
};

export default Polygon;
