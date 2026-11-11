const canvas = document.querySelector("[data-campusflow-scene]");

if (canvas) {
  import("https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js")
    .then(({ AmbientLight, DirectionalLight, DodecahedronGeometry, EdgesGeometry, Group, IcosahedronGeometry, LineBasicMaterial, LineSegments, Mesh, MeshPhysicalMaterial, OctahedronGeometry, PerspectiveCamera, Scene, TorusGeometry, WebGLRenderer }) => {
      const scene = new Scene();
      const camera = new PerspectiveCamera(38, 1, 0.1, 80);
      camera.position.z = 17;

      let renderer;
      try {
        renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
      } catch {
        canvas.hidden = true;
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = "srgb";
      scene.add(new AmbientLight(0xffffff, 2.2));

      const keyLight = new DirectionalLight(0xffffff, 2.4);
      keyLight.position.set(-4, 7, 10);
      scene.add(keyLight);

      const shapes = [
        { geometry: new DodecahedronGeometry(1, 0), color: 0x0b9b8e, scale: 0.82, x: 0.08, y: 0.18, speed: 0.13 },
        { geometry: new IcosahedronGeometry(1, 0), color: 0xf1785e, scale: 0.9, x: 0.92, y: 0.19, speed: -0.11 },
        { geometry: new OctahedronGeometry(1, 0), color: 0xe9ad43, scale: 0.68, x: 0.88, y: 0.78, speed: 0.16 },
        { geometry: new DodecahedronGeometry(1, 0), color: 0x4d83a4, scale: 0.58, x: 0.1, y: 0.82, speed: -0.14 },
        { geometry: new TorusGeometry(0.78, 0.035, 8, 48), color: 0xe3aa43, scale: 0.9, x: 0.77, y: 0.51, speed: 0.18 },
        { geometry: new TorusGeometry(0.58, 0.028, 8, 48), color: 0x0b9b8e, scale: 0.72, x: 0.2, y: 0.47, speed: -0.17 },
      ];

      const objects = shapes.map((shape, index) => {
        const group = new Group();
        const fill = new MeshPhysicalMaterial({
          color: shape.color,
          emissive: shape.color,
          emissiveIntensity: 0.11,
          metalness: 0.48,
          roughness: 0.28,
          flatShading: true,
          transparent: true,
          opacity: shape.geometry.type === "TorusGeometry" ? 0.24 : 0.16,
          depthWrite: false,
        });
        const mesh = new Mesh(shape.geometry, fill);
        group.add(mesh);

        if (shape.geometry.type !== "TorusGeometry") {
          const wireframe = new LineSegments(
            new EdgesGeometry(shape.geometry, 18),
            new LineBasicMaterial({ color: shape.color, transparent: true, opacity: 0.48, depthWrite: false }),
          );
          wireframe.scale.setScalar(1.012);
          group.add(wireframe);
        }

        group.scale.setScalar(shape.scale);
        group.userData = { ...shape, phase: index * 1.13, originY: 0 };
        scene.add(group);
        return group;
      });

      const resize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);

        const visibleHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
        const visibleWidth = visibleHeight * camera.aspect;
        for (const object of objects) {
          const { x, y } = object.userData;
          object.position.set((x - 0.5) * visibleWidth, (0.5 - y) * visibleHeight, -1.5);
          object.userData.originY = object.position.y;
        }
      };

      resize();
      window.addEventListener("resize", resize, { passive: true });

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let elapsed = 0;
      let previousTime = 0;
      const render = (time = 0) => {
        const delta = Math.min((time - previousTime) / 1000, 0.05);
        previousTime = time;
        elapsed += delta;

        if (!reducedMotion) {
          objects.forEach((object) => {
            const { speed, phase, originY } = object.userData;
            object.rotation.x += delta * speed;
            object.rotation.y += delta * speed * 1.4;
            object.rotation.z += delta * speed * 0.45;
            object.position.y = originY + Math.sin(elapsed * 0.48 + phase) * 0.12;
          });
        }

        renderer.render(scene, camera);
        if (!reducedMotion) window.requestAnimationFrame(render);
      };

      if (reducedMotion) render();
      else window.requestAnimationFrame(render);
    })
    .catch(() => {
      canvas.hidden = true;
    });
}