"use client";
import React, { useMemo, useRef, useEffect } from "react";
import { Marker } from "@/lib/simplifyMarkers";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

// 全局材质缓存
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
}

const Polygon: React.FC<PolygonProps> = ({
  markers,
  localization,
  distanceThreshold = 50, // 默认50单位距离触发LOD
}) => {
  const { camera, invalidate } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // 根据颜色获取或创建材质
  const getMaterial = (r = 1, g = 0, b = 0) => {
    const key = `${r}-${g}-${b}`;
    if (!materialCache.has(key)) {
      materialCache.set(
        key,
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(r, g, b),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.5,
        })
      );
    }
    return materialCache.get(key);
  };

  // 几何体简化函数 - 根据距离级别减少点的数量
  const simplifyPoints = (points: THREE.Vector2[], detailLevel: number) => {
    // 如果是高细节级别，返回原始点
    if (detailLevel === 0) return points;

    // 否则根据细节级别跳过一些点
    const step = detailLevel + 1;
    return points.filter((_, i) => i % step === 0);
  };

  // 预先处理并缓存几何体数据
  const polygonData = useMemo(() => {
    if (!markers || !localization) return [];

    return markers
      .map((marker) => {
        // 转换点坐标
        const points = marker.points?.map((point) => {
          const x = point.x - (localization?.position.x || 0);
          const z = point.z - (localization?.position.z || 0);
          return new THREE.Vector2(x, z);
        });

        if (!points || points.length < 3) return null;

        // 计算中心点 (用于LOD计算)
        const center = new THREE.Vector3();
        points.forEach((p) => center.add(new THREE.Vector3(p.x, 0, p.y)));
        center.divideScalar(points.length);

        // 准备不同LOD级别的几何体
        const lodGeometries = [
          { level: 0, geometry: createExtrudedGeometry(points) },
          {
            level: 1,
            geometry: createExtrudedGeometry(simplifyPoints(points, 1)),
          },
          {
            level: 2,
            geometry: createExtrudedGeometry(simplifyPoints(points, 3)),
          },
        ];

        return {
          center,
          lodGeometries,
          color: {
            r: marker.color?.r || 1,
            g: marker.color?.g || 0,
            b: marker.color?.b || 0,
          },
        };
      })
      .filter(Boolean);
  }, [markers, localization]); // 只在markers或localization变化时重新计算

  // 创建拉伸几何体函数
  function createExtrudedGeometry(points: THREE.Vector2[]) {
    const shape = new THREE.Shape();
    shape.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    shape.lineTo(points[0].x, points[0].y);

    const extrudeSettings = {
      depth: -1.5,
      bevelEnabled: false,
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // 应用旋转
    geometry.rotateX(-Math.PI / 2 + 2 * Math.PI);
    geometry.rotateY(-Math.PI / 2 - Math.PI / 2);
    geometry.rotateZ(-Math.PI);

    return geometry;
  }

  // 当前显示的LOD级别
  const [currentLODs, setCurrentLODs] = React.useState<number[]>([]);

  // 视锥体检查和LOD更新
  useFrame(() => {
    if (!groupRef.current || polygonData.length === 0) return;

    // 创建视锥体
    const frustum = new THREE.Frustum();
    const projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(projScreenMatrix);

    // 计算新的LOD级别
    const newLODs = polygonData.map((item, index) => {
      // 确保item不为null
      if (!item) return -1; // 不可见

      // 检查是否在视锥体中
      const boundingSphere = new THREE.Sphere(item.center, 20); // 假设半径为20
      const isVisible = frustum.intersectsSphere(boundingSphere);

      if (!isVisible) return -1; // 不可见

      // 根据距离选择LOD级别
      const distance = camera.position.distanceTo(item.center);
      if (distance > distanceThreshold * 2) return 2; // 远距离 - 低细节
      if (distance > distanceThreshold) return 1; // 中等距离 - 中等细节
      return 0; // 近距离 - 高细节
    });

    // 如果LOD级别有变化，更新状态并触发重新渲染
    if (JSON.stringify(newLODs) !== JSON.stringify(currentLODs)) {
      setCurrentLODs(newLODs);
      invalidate(); // 请求重新渲染
    }
  });

  // 渲染最终的多边形
  const renderPolygons = useMemo(() => {
    if (currentLODs.length === 0) {
      // 第一次渲染时，使用默认LOD级别0
      return polygonData
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .map((item, index) => (
          <mesh
            key={index}
            geometry={item.lodGeometries[0].geometry}
            material={getMaterial(item.color.r, item.color.g, item.color.b)}
          />
        ));
    }

    return polygonData
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .map((item, index) => {
        const lodLevel = currentLODs[index];
        if (lodLevel === -1) return null; // 不在视锥体内，不渲染

        const geometry =
          item.lodGeometries[Math.min(lodLevel, item.lodGeometries.length - 1)]
            .geometry;
        return (
          <mesh
            key={index}
            geometry={geometry}
            material={getMaterial(item.color.r, item.color.g, item.color.b)}
          />
        );
      })
      .filter(Boolean);
  }, [polygonData, currentLODs]);

  // 清理函数 - 组件卸载时释放几何体
  useEffect(() => {
    return () => {
      // 清理几何体
      polygonData.forEach((item) => {
        if (item) {
          item.lodGeometries.forEach((lodItem) => {
            lodItem.geometry.dispose();
          });
        }
      });
    };
  }, [polygonData]);

  // 如果没有有效的数据，不渲染任何内容
  if (polygonData.length === 0) {
    return null;
  }

  return <group ref={groupRef}>{renderPolygons}</group>;
};

export default Polygon;
