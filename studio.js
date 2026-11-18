/* PolyComp Studio v3.0 — lógica de módulos sobre datos.js verificado */
(function () {
  'use strict';
  var D = (typeof DATOS !== 'undefined') ? DATOS : window.DATOS;
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var fmt = function (n, d) { return Number(n).toFixed(d === undefined ? 2 : d).replace('.', ','); };
  var NOMBRES = ['PP virgen (0 % rCB)', 'PP + 5 % TTB', 'PP + 10 % TTB', 'PP + 15 % TTB'];
  var COLORES = ['#EDEDE8', '#8E9294', '#55595C', '#2E3235'];
  var MASAS = D.propiedades.masa_estimada_g;
  var HAL = D.halpin, COMP = D.comprobacion, FLU = D.fluencia_MPa;

  /* ---------- M01 formulador ---------- */
  function pintaFormulador(i) {
    $('#f-vf').textContent = fmt(HAL.Vf[i], 2) + ' %';
    $('#f-rho').textContent = fmt(HAL.rho[i], 3) + ' g/cm³';
    $('#f-ec').textContent = fmt(HAL.Ec[i], 3) + ' GPa';
    $('#f-eesp').textContent = fmt(HAL.Eesp[i], 3);
    $('#f-sig').textContent = fmt(FLU[NOMBRES[i]], 0) + ' MPa';
    $('#f-masa').textContent = fmt(MASAS[NOMBRES[i]], 0) + ' g';
    $('#f-swatch').style.background = COLORES[i];
    $$('#f-btns button').forEach(function (b, k) { b.classList.toggle('on', k === i); });
  }
  (function () {
    var tb = $('#f-tab tbody');
    NOMBRES.forEach(function (n, i) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + n + '</td><td class="mono">' + HAL.w[i] + '</td><td class="mono">' + fmt(HAL.Vf[i], 2) +
        '</td><td class="mono">' + fmt(HAL.rho[i], 3) + '</td><td class="mono">' + fmt(HAL.Ec[i], 3) +
        '</td><td class="mono">' + (i ? '+' + fmt(HAL.dEc[i], 2) + ' %' : '—') +
        '</td><td class="mono">' + fmt(HAL.Eesp[i], 3) + '</td><td class="mono">' + fmt(FLU[n], 0) +
        '</td><td class="mono">' + fmt(MASAS[n], 0) + '</td>';
      tb.appendChild(tr);
    });
    $$('#f-btns button').forEach(function (b, i) {
      b.addEventListener('click', function () { pintaFormulador(i); });
    });
    pintaFormulador(2);
  })();

  /* ---------- M02 halpin-tsai ---------- */
  function leeM() {
    return {
      w: parseFloat($('#m-w').value) / 100,
      Ef: parseFloat($('#m-ef').value), Em: parseFloat($('#m-em').value),
      xi: parseFloat($('#m-xi').value), rf: parseFloat($('#m-rf').value), rm: parseFloat($('#m-rm').value)
    };
  }
  function ecDe(w, p) {
    var Vf = (w / p.rf) / (w / p.rf + (1 - w) / p.rm);
    var eta = (p.Ef / p.Em - 1) / (p.Ef / p.Em + p.xi);
    var Ec = p.Em * (1 + p.xi * eta * Vf) / (1 - eta * Vf);
    var rho = 1 / (w / p.rf + (1 - w) / p.rm);
    return { Vf: Vf, Ec: Ec, rho: rho };
  }
  function cv(id) {
    var c = $(id), dpr = window.devicePixelRatio || 1;
    var w = c.clientWidth, h = c.clientHeight;
    c.width = w * dpr; c.height = h * dpr;
    var g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    return { g: g, w: w, h: h };
  }
  function pintaM() {
    var p = leeM();
    $('#m-wv').textContent = fmt(parseFloat($('#m-w').value), 1);
    var r = ecDe(p.w, p);
    $('#m-vf').textContent = fmt(r.Vf * 100, 2) + ' %';
    $('#m-rho').textContent = fmt(r.rho, 3) + ' g/cm³';
    $('#m-ec').textContent = fmt(r.Ec / 1000, 3) + ' GPa';
    $('#m-dec').textContent = '+' + fmt((r.Ec / p.Em - 1) * 100, 2) + ' %';
    $('#m-eesp').textContent = fmt(r.Ec / 1000 / r.rho, 3);
    var o = cv('#m-canvas'), g = o.g, W = o.w, H = o.h;
    var pad = 34, wmax = 20;
    var pts = [];
    for (var w = 0; w <= wmax; w += 0.5) pts.push([w, ecDe(w / 100, p).Ec / 1000]);
    var ymin = Math.min.apply(null, pts.map(function (q) { return q[1]; })) * 0.98;
    var ymax = Math.max.apply(null, pts.map(function (q) { return q[1]; })) * 1.02;
    var X = function (w) { return pad + (w / wmax) * (W - pad - 12); };
    var Y = function (v) { return H - 24 - ((v - ymin) / (ymax - ymin)) * (H - 40); };
    g.strokeStyle = '#14181C'; g.lineWidth = 1; g.font = '10px monospace'; g.fillStyle = '#4B5560';
    g.beginPath(); g.moveTo(pad, 8); g.lineTo(pad, H - 24); g.lineTo(W - 8, H - 24); g.stroke();
    g.fillText('Ec (GPa)', 4, 14); g.fillText('w (% p/p)', W - 60, H - 8);
    g.fillText(fmt(ymin, 2), 2, Y(ymin) + 3); g.fillText(fmt(ymax, 2), 2, Y(ymax) + 3);
    g.strokeStyle = '#1E40AF'; g.lineWidth = 2; g.beginPath();
    pts.forEach(function (q, i) { i ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1])); });
    g.stroke();
    HAL.w.forEach(function (w, i) {
      g.fillStyle = '#14181C'; g.beginPath(); g.arc(X(w), Y(HAL.Ec[i]), 3.5, 0, 7); g.fill();
      g.fillText(fmt(HAL.Ec[i], 3), X(w) - 14, Y(HAL.Ec[i]) - 7);
    });
    g.fillStyle = '#C2410C'; g.beginPath(); g.arc(X(p.w * 100), Y(r.Ec / 1000), 5, 0, 7); g.fill();
  }
  ['m-w', 'm-ef', 'm-em', 'm-xi', 'm-rf', 'm-rm'].forEach(function (id) {
    $('#' + id).addEventListener('input', pintaM);
  });
  window.addEventListener('resize', function () { pintaM(); pintaACV(); });

  /* ---------- M03 iso 10328 ---------- */
  var FSKEY = ['FS_PP_virgen', 'FS_PP_mas_5_pct_TTB', 'FS_PP_mas_10_pct_TTB', 'FS_PP_mas_15_pct_TTB'];
  function pintaISO(nivel) {
    var c = COMP[nivel];
    $('#i-f').textContent = fmt(c.carga_axial_N, 0) + ' N';
    $('#i-m').textContent = fmt(c.momento_flector_Nmm / 1000, 1) + ' N·m';
    $('#i-sax').textContent = fmt(c.sigma_axial_MPa, 3) + ' MPa';
    $('#i-sap').textContent = fmt(c.sigma_flexion_AP_MPa, 2) + ' MPa';
    $('#i-sml').textContent = fmt(c.sigma_flexion_ML_MPa, 2) + ' MPa';
    $('#i-smax').textContent = fmt(c.sigma_maxima_MPa, 2) + ' MPa';
    $('#i-secc').textContent = 'Sección de referencia: ' + COMP.seccion_de_referencia + '. A = ' +
      fmt(COMP.area_de_material_mm2, 1) + ' mm² · c = ' + fmt(COMP.fibra_maxima_mm, 1) + ' mm · e = ' +
      fmt(COMP.excentricidad_de_carga_asumida_mm, 0) + ' mm.';
    $$('#i-btns button').forEach(function (b) { b.classList.toggle('on', b.dataset.n === nivel); });
    pintaFS(nivel);
  }
  function pintaFS(nivel) {
    var i = parseInt($('#i-mat').value, 10) / 5;
    var c = COMP[nivel];
    $('#i-fs').textContent = fmt(c[FSKEY[i]], 2);
    $('#i-sy').textContent = fmt(FLU[NOMBRES[i]], 0) + ' MPa';
  }
  (function () {
    var tb = $('#i-tab tbody');
    NOMBRES.forEach(function (n, i) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + n + '</td><td class="mono">' + fmt(COMP.P5[FSKEY[i]], 2) +
        '</td><td class="mono">' + fmt(COMP.P6[FSKEY[i]], 2) + '</td>';
      tb.appendChild(tr);
    });
    $$('#i-btns button').forEach(function (b) {
      b.addEventListener('click', function () { pintaISO(b.dataset.n); });
    });
    $('#i-mat').addEventListener('change', function () {
      pintaFS($('#i-btns .on').dataset.n);
    });
    pintaISO('P6');
  })();

  /* ---------- M04 visor ---------- */
  (function () {
    var box = $('#visorbox'), canvas = $('#visor3d');
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101418);
    var pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
    var cam = new THREE.PerspectiveCamera(42, 2, 1, 5000);
    var ctrl = new THREE.OrbitControls(cam, canvas);
    ctrl.enableDamping = true; ctrl.dampingFactor = 0.08;
    var luz = new THREE.DirectionalLight(0xffffff, 1.1);
    luz.position.set(220, 320, 180); luz.castShadow = true;
    luz.shadow.mapSize.set(1024, 1024);
    luz.shadow.camera.left = -250; luz.shadow.camera.right = 250;
    luz.shadow.camera.top = 250; luz.shadow.camera.bottom = -250;
    scene.add(luz);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    var suelo = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400),
      new THREE.ShadowMaterial({ opacity: 0.35 }));
    suelo.rotation.x = -Math.PI / 2; suelo.position.y = -205; suelo.receiveShadow = true;
    scene.add(suelo);
    var plano = new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e6);
    var grupo = null, nodos = [], tris = 0;
    var bin = Uint8Array.from(atob(GLB_B64), function (c) { return c.charCodeAt(0); }).buffer;
    new THREE.GLTFLoader().parse(bin, '', function (gltf) {
      grupo = gltf.scene;
      grupo.traverse(function (o) {
        if (o.isMesh) {
          o.castShadow = true;
          tris += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3;
          o.userData.base = o.position.z;
          nodos.push(o);
        }
      });
      scene.add(grupo);
      $('#st-tris').textContent = Math.round(tris).toLocaleString('es-CO');
      pintaPanel();
      ajusta();
      vista('iso');
    }, function () { $('#vpanel').textContent = 'No fue posible analizar el GLB incrustado.'; });
    function pintaPanel() {
      var i = parseInt($('#s-mat').value, 10) / 5;
      var v = D.verificacion;
      $('#vpanel').innerHTML =
        '<b>ENCAJE_TRANSTIBIAL_UAO</b>' +
        '<div class="row"><span>Boca ML / AP</span><span>114,9 / 95,0 mm</span></div>' +
        '<div class="row"><span>Profundidad útil</span><span>180 mm</span></div>' +
        '<div class="row"><span>Pared medida</span><span>5,0 – 8,4 mm</span></div>' +
        '<div class="row"><span>Flexión inicial</span><span>5°</span></div>' +
        '<div class="row"><span>Volumen</span><span>307,4 cm³</span></div>' +
        '<div class="row"><span>Masa (' + HAL.w[i] + ' % TTB)</span><span>' + fmt(MASAS[NOMBRES[i]], 0) + ' g</span></div>' +
        '<div class="row"><span>σ máx P6 / FS</span><span>2,94 MPa / 9,88</span></div>' +
        '<div class="row"><span>Sólido</span><span>' + (v.solido_valido ? 'válido, cerrado' : 'revisar') + '</span></div>' +
        '<div class="row"><span>Triángulos</span><span>' + Math.round(tris).toLocaleString('es-CO') + '</span></div>';
      if (nodos.length) {
        nodos.forEach(function (o) {
          if (/Encaje/i.test(o.name)) o.material.color.set(COLORES[i]);
        });
      }
    }
    var VISTAS = {
      iso: [320, 240, 340], frontal: [0, 40, 480], lateral: [480, 40, 0], superior: [0, 500, 1]
    };
    function vista(k) {
      var p = VISTAS[k];
      cam.position.set(p[0], p[1], p[2]);
      ctrl.target.set(0, 0, -60);
      ctrl.update();
      $$('.vhud [data-vista]').forEach(function (b) { b.classList.toggle('on', b.dataset.vista === k); });
    }
    var expl = false, corte = false, wire = false;
    $('#b-explode').addEventListener('click', function () {
      expl = !expl; this.classList.toggle('on', expl);
    });
    $('#b-corte').addEventListener('click', function () {
      corte = !corte; this.classList.toggle('on', corte);
      plano.constant = corte ? 0 : 1e6;
      nodos.forEach(function (o) { o.material.clippingPlanes = corte ? [plano] : null; o.material.needsUpdate = true; });
    });
    $('#b-wire').addEventListener('click', function () {
      wire = !wire; this.classList.toggle('on', wire);
      nodos.forEach(function (o) { o.material.wireframe = wire; });
    });
    $('#b-rot').addEventListener('click', function () {
      ctrl.autoRotate = !ctrl.autoRotate; ctrl.autoRotateSpeed = 1.4;
      this.classList.toggle('on', ctrl.autoRotate);
    });
    $('#b-reset').addEventListener('click', function () {
      expl = false; corte = false; wire = false; ctrl.autoRotate = false;
      plano.constant = 1e6;
      nodos.forEach(function (o) {
        o.material.clippingPlanes = null; o.material.wireframe = false; o.material.needsUpdate = true;
      });
      $$('#b-explode,#b-corte,#b-wire,#b-rot').forEach(function (b) { b.classList.remove('on'); });
      vista('iso');
    });
    $$('.vhud [data-vista]').forEach(function (b) {
      b.addEventListener('click', function () { vista(b.dataset.vista); });
    });
    $('#s-mat').addEventListener('change', pintaPanel);
    function ajusta() {
      var w = box.clientWidth, h = box.clientHeight;
      renderer.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
    }
    window.addEventListener('resize', ajusta);
    (function loop() {
      requestAnimationFrame(loop);
      nodos.forEach(function (o, i) {
        var t = o.userData.base + (expl ? [-0, -70, -150][Math.min(i, 2)] : 0);
        o.position.z += (t - o.position.z) * 0.12;
      });
      ctrl.update();
      renderer.render(scene, cam);
    })();
    /* tabla de secciones */
    var tb = $('#v-secc tbody');
    Object.keys(D.secciones).forEach(function (z) {
      var s = D.secciones[z];
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="mono">' + z.replace('z=', '') + '</td><td class="mono">' + fmt(s.area_de_material_mm2, 1) +
        '</td><td class="mono">' + s.Ixx_mm4_flexion_AP.toLocaleString('es-CO') +
        '</td><td class="mono">' + s.Iyy_mm4_flexion_ML.toLocaleString('es-CO') +
        '</td><td class="mono">' + fmt(s.fibra_maxima_mm, 1) + '</td><td class="mono">' + fmt(s.espesor_medio_de_pared_mm, 2) +
        '</td><td class="mono">' + fmt(s.perimetro_exterior_mm, 1) + '</td>';
      tb.appendChild(tr);
    });
  })();

  /* ---------- M05 trazabilidad ---------- */
  var TRAZA = [
    ['NFU procesados en Dillingen', '≈23.000 t/año', 'pyrum', 'Pyrum Innovations AG (2026), comunicación técnica'],
    ['Reactores en Dillingen', '3 × ≈5.000 t granulado/año', 'pyrum', 'Pyrum Innovations AG (2026)'],
    ['Planta de Chequia', '3 reactores, 15.000 t/año de diseño', 'pyrum', 'Pyrum Innovations AG (2026); capacidad de diseño, no producción'],
    ['Rendimientos de pirólisis', 'sólido 40–45 %, TPO 40 %, gas 15–20 %', 'pyrum', 'Pyrum Innovations AG (2026); rangos, no balance cerrado'],
    ['BET del rCB', '65–85 m²/g (indicativo)', 'pyrum', 'Pyrum Innovations AG (2026); no garantizado'],
    ['STSA del rCB', '50–70 m²/g', 'pyrum', 'Pyrum Innovations AG (2026)'],
    ['Ensayos del rCB en poliolefinas', 'PP y PE, sin detalle de formulación', 'pyrum', 'Pyrum Innovations AG (2026)'],
    ['Alimentación del reactor', 'granulado de caucho, nunca neumático entero', 'pyrum', 'Pyrum Innovations AG (2026)'],
    ['GWP100 de seis escenarios', '−747 a +164 kg CO₂-eq/t NFU', 'biblio', 'Maga, Aryan & Blömer (2022), Fraunhofer UMSICHT'],
    ['Módulo de la carga Ef', '12.000 MPa (supuesto)', 'biblio', 'Literatura de agregados de negro de humo; supuesto etiquetado'],
    ['Factor de forma ξ', '2', 'biblio', 'Halpin–Tsai para compuestos particulados'],
    ['Compatibilizante PP-g-MA', '≈2 % en peso', 'biblio', 'Literatura de cargas minerales en PP'],
    ['Fluencia asumida del compuesto', '33 → 28 MPa (0 → 15 % TTB)', 'teor', 'Supuesto propio con base en literatura de PP cargado'],
    ['Módulos Ec predichos', '1,350 / 1,427 / 1,511 / 1,604 GPa', 'teor', 'Halpin–Tsai con ξ = 2 sobre datos del proyecto'],
    ['σ máxima y FS bajo P6', '2,94 MPa · FS 9,88 (10 % TTB)', 'teor', 'Cálculo analítico propio, sección z = −90 mm'],
    ['Boca del encaje ML / AP', '114,9 / 95,0 mm', 'cad', 'Medición propia sobre el sólido STEP'],
    ['Caja envolvente', '114,9 × 97,9 × 189,0 mm', 'cad', 'Medición propia sobre el sólido STEP'],
    ['Espesor de pared', '5,0 – 8,4 mm', 'cad', 'Medición propia en nueve secciones'],
    ['Volumen de material', '307,4 cm³', 'cad', 'Medición propia sobre el sólido STEP'],
    ['Masa del encaje', '278 – 301 g según carga', 'cad', 'Volumen medido × densidad del compuesto'],
    ['Interfaz piramidal', '30 × 30 × 12 mm, 4 × M6 a 22 mm', 'cad', 'Diseño propio según interfaz normalizada de adaptadores'],
    ['Pilón tubular', 'Ø30 × 1,5 × 250 mm', 'cad', 'Diseño propio de referencia'],
    ['Flexión y barra patelar', '5°; relieve 8 mm a 45 mm', 'cad', 'Diseño propio con referencia de encajes transtibiales'],
    ['Teselación del visor', '29.774 triángulos a 0,15 mm', 'cad', 'Exportador propio glb_export.py sobre el B-rep'],
    ['Ficha técnica TDS', 'PI-ADA-PYR-004 rev. 6: 16 propiedades típicas con método', 'pyrum', 'Pyrum Innovations AG (2026b); valores típicos, no garantizados'],
    ['Ficha de seguridad SDS', 'SDS-TTB-EN v7: composición, CLP, exposición y explosividad', 'pyrum', 'Pyrum Innovations AG (2026c); documento regulatorio del productor'],
    ['Correspondencia con Pyrum', '7 capturas del hilo, 29/09–11/11/2026', 'real', 'Evidencia primaria del proyecto; Anexo B y módulo M09']
  ];
  var ETIQ = { real: ['REAL PROYECTO', 'o-real'], pyrum: ['PYRUM', 'o-pyrum'], biblio: ['BIBLIOGRÁFICO', 'o-biblio'], teor: ['ESC. TEÓRICO', 'o-teor'], cad: ['MEDIDA / CAD', 'o-cad'] };
  function pintaTraza(f) {
    var tb = $('#t-body'); tb.innerHTML = '';
    TRAZA.filter(function (r) { return f === 'todos' || r[2] === f; }).forEach(function (r) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + r[0] + '</td><td class="mono">' + r[1] + '</td><td><span class="o ' +
        ETIQ[r[2]][1] + '">' + ETIQ[r[2]][0] + '</span></td><td class="small">' + r[3] + '</td>';
      tb.appendChild(tr);
    });
  }
  $$('#t-filtros button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('#t-filtros button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on'); pintaTraza(b.dataset.o);
    });
  });
  pintaTraza('todos');
  $('#st-datos').textContent = TRAZA.length;

  /* ---------- M06 acv ---------- */
  function pintaACV() {
    var o = cv('#a-canvas'), g = o.g, W = o.w, H = o.h;
    var A = D.acv, n = A.length;
    var max = Math.max.apply(null, A.map(function (a) { return Math.abs(a.gwp); }));
    var bw = (W - 90) / n;
    var y0 = H * 0.52;
    g.strokeStyle = '#14181C'; g.beginPath(); g.moveTo(46, y0); g.lineTo(W - 8, y0); g.stroke();
    g.font = '10px monospace'; g.fillStyle = '#4B5560';
    g.fillText('0', 34, y0 + 3);
    A.forEach(function (a, i) {
      var h = Math.abs(a.gwp) / max * (H * 0.4);
      var x = 56 + i * bw;
      g.fillStyle = a.gwp < 0 ? '#15803D' : '#B91C1C';
      if (a.gwp < 0) g.fillRect(x, y0 - h, bw - 14, h); else g.fillRect(x, y0, bw - 14, h);
      g.fillStyle = '#14181C';
      g.fillText('E' + (i + 1), x + 4, H - 8);
      g.fillText((a.gwp > 0 ? '+' : '') + a.gwp, x - 2, a.gwp < 0 ? y0 - h - 5 : y0 + h + 11);
    });
    var tb = $('#a-tab tbody'); tb.innerHTML = '';
    A.forEach(function (a, i) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>E' + (i + 1) + '. ' + a.esc.replace(/^Escenario \d+: /, '') +
        '</td><td class="mono" style="color:' + (a.gwp < 0 ? '#15803D' : '#B91C1C') + ';font-weight:700">' +
        (a.gwp > 0 ? '+' : '') + a.gwp + '</td>';
      tb.appendChild(tr);
    });
  }
  pintaM(); pintaACV();
})();
