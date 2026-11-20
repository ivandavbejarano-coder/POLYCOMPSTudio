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
  if (FLU['PP virgen'] !== undefined) FLU['PP virgen (0 % rCB)'] = FLU['PP virgen'];

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
        '</td><td class="mono">' + (i ? '+' + fmt(HAL.dEc[i], 2) + ' %' : '0,00') +
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
  function ecDe(w, p, corr) {
    var Vf = (w / p.rf) / (w / p.rf + (1 - w) / p.rm);
    var Ef = p.Ef;
    if (corr) { Ef = p.Em + corr.k * (p.Ef - p.Em); Vf = corr.a * Vf; }
    var eta = (Ef / p.Em - 1) / (Ef / p.Em + p.xi);
    var Ec = p.Em * (1 + p.xi * eta * Vf) / (1 - eta * Vf);
    if (corr) Ec *= 1 - corr.pv / 100;
    var rho = 1 / (w / p.rf + (1 - w) / p.rm);
    return { Vf: Vf, Ec: Ec, rho: rho };
  }
  function leeCorr() {
    if (!$('#m-adv').checked) return null;
    return { pv: parseFloat($('#m-pv').value), k: parseFloat($('#m-k').value), a: parseFloat($('#m-a').value) };
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
    $('#m-pvv').textContent = fmt($('#m-pv').value, 1);
    $('#m-kv').textContent = fmt($('#m-k').value, 2);
    $('#m-av').textContent = fmt($('#m-a').value, 2);
    var r = ecDe(p.w, p);
    $('#m-vf').textContent = fmt(r.Vf * 100, 2) + ' %';
    $('#m-rho').textContent = fmt(r.rho, 3) + ' g/cm³';
    $('#m-ec').textContent = fmt(r.Ec / 1000, 3) + ' GPa';
    $('#m-dec').textContent = '+' + fmt((r.Ec / p.Em - 1) * 100, 2) + ' %';
    $('#m-eesp').textContent = fmt(r.Ec / 1000 / r.rho, 3);
    var corr = leeCorr(), ra = corr ? ecDe(p.w, p, corr) : null;
    $('#m-adjcell').style.display = ra ? '' : 'none';
    $('#m-adjcell2').style.display = ra ? '' : 'none';
    if (ra) {
      $('#m-eca').textContent = fmt(ra.Ec / 1000, 3) + ' GPa';
      $('#m-ade').textContent = fmt((ra.Ec / r.Ec - 1) * 100, 1) + ' %';
    }
    var o = cv('#m-canvas'), g = o.g, W = o.w, H = o.h;
    var pad = 34, wmax = 20;
    var pts = [], ptsA = [];
    for (var w = 0; w <= wmax; w += 0.5) {
      pts.push([w, ecDe(w / 100, p).Ec / 1000]);
      if (corr) ptsA.push([w, ecDe(w / 100, p, corr).Ec / 1000]);
    }
    var todos = pts.concat(ptsA).map(function (q) { return q[1]; });
    var ymin = Math.min.apply(null, todos) * 0.98;
    var ymax = Math.max.apply(null, todos) * 1.02;
    var X = function (w) { return pad + (w / wmax) * (W - pad - 12); };
    var Y = function (v) { return H - 24 - ((v - ymin) / (ymax - ymin)) * (H - 40); };
    g.strokeStyle = '#14181C'; g.lineWidth = 1; g.font = '10px monospace'; g.fillStyle = '#4B5560';
    g.beginPath(); g.moveTo(pad, 8); g.lineTo(pad, H - 24); g.lineTo(W - 8, H - 24); g.stroke();
    g.fillText('Ec (GPa)', 4, 14); g.fillText('w (% p/p)', W - 60, H - 8);
    g.fillText(fmt(ymin, 2), 2, Y(ymin) + 3); g.fillText(fmt(ymax, 2), 2, Y(ymax) + 3);
    var curva = function (arr, color, dashed) {
      g.strokeStyle = color; g.lineWidth = 2; g.setLineDash(dashed ? [5, 4] : []);
      g.beginPath();
      arr.forEach(function (q, i) { i ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1])); });
      g.stroke(); g.setLineDash([]);
    };
    curva(pts, '#1E40AF', false);
    if (ra) curva(ptsA, '#C2410C', true);
    HAL.w.forEach(function (w, i) {
      g.fillStyle = '#14181C'; g.beginPath(); g.arc(X(w), Y(HAL.Ec[i]), 3.5, 0, 7); g.fill();
      g.fillText(fmt(HAL.Ec[i], 3), X(w) - 14, Y(HAL.Ec[i]) - 7);
    });
    g.fillStyle = '#C2410C'; g.beginPath(); g.arc(X(p.w * 100), Y((ra || r).Ec / 1000), 5, 0, 7); g.fill();
    if (ra) { g.fillStyle = '#1E40AF'; g.beginPath(); g.arc(X(p.w * 100), Y(r.Ec / 1000), 4, 0, 7); g.fill(); }
  }
  ['m-w', 'm-ef', 'm-em', 'm-xi', 'm-rf', 'm-rm', 'm-pv', 'm-k', 'm-a'].forEach(function (id) {
    $('#' + id).addEventListener('input', pintaM);
  });
  $('#m-adv').addEventListener('change', function () {
    $('#m-advbox').style.display = this.checked ? '' : 'none';
    pintaM();
  });
  window.addEventListener('resize', function () {
    pintaM(); pintaACV();
    if ($('#i-btns .on')) pintaPerfil($('#i-btns .on').dataset.n);
  });

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
    pintaPerfil(nivel);
  }
  function pintaFS(nivel) {
    var i = parseInt($('#i-mat').value, 10) / 5;
    var c = COMP[nivel];
    $('#i-fs').textContent = fmt(c[FSKEY[i]], 2);
    $('#i-sy').textContent = fmt(FLU[NOMBRES[i]], 0) + ' MPa';
  }
  function perfilSigma(nivel) {
    var c = COMP[nivel], F = c.carga_axial_N, M = c.momento_flector_Nmm;
    return Object.keys(D.secciones).map(function (z) {
      var s = D.secciones[z];
      var sax = F / s.area_de_material_mm2;
      var sap = M * s.fibra_maxima_mm / s.Ixx_mm4_flexion_AP;
      return { z: parseFloat(z.replace('z=', '')), s: s, sax: sax, sap: sap, smax: sax + sap };
    });
  }
  function pintaPerfil(nivel) {
    var rows = perfilSigma(nivel);
    var i = parseInt($('#i-mat').value, 10) / 5;
    var sy = FLU[NOMBRES[i]];
    var tb = $('#i-tab2 tbody'); tb.innerHTML = '';
    rows.forEach(function (r) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="mono">' + r.z + '</td><td class="mono">' + fmt(r.s.area_de_material_mm2, 1) +
        '</td><td class="mono">' + fmt(r.s.fibra_maxima_mm, 1) +
        '</td><td class="mono">' + r.s.Ixx_mm4_flexion_AP.toLocaleString('es-CO') +
        '</td><td class="mono">' + fmt(r.sax, 2) + '</td><td class="mono">' + fmt(r.sap, 2) +
        '</td><td class="mono"><b>' + fmt(r.smax, 2) + '</b></td><td class="mono">' + fmt(sy / r.smax, 2) + '</td>';
      tb.appendChild(tr);
    });
    var o = cv('#i-canvas'), g = o.g, W = o.w, H = o.h;
    var pad = 40;
    var zmin = Math.min.apply(null, rows.map(function (r) { return r.z; }));
    var smaxT = Math.max.apply(null, rows.map(function (r) { return r.smax; }));
    var X = function (z) { return pad + (z / zmin) * (W - pad - 14); };
    var Y = function (v) { return H - 26 - (v / (smaxT * 1.12)) * (H - 44); };
    g.strokeStyle = '#14181C'; g.lineWidth = 1; g.font = '10px monospace'; g.fillStyle = '#4B5560';
    g.beginPath(); g.moveTo(pad, 8); g.lineTo(pad, H - 26); g.lineTo(W - 8, H - 26); g.stroke();
    g.fillText('σ máx (MPa)', 2, 14); g.fillText('z (mm)', W - 46, H - 10);
    g.fillText('0', pad - 12, H - 23); g.fillText(fmt(smaxT * 1.12, 1), 2, Y(smaxT * 1.12) + 9);
    g.setLineDash([4, 4]); g.strokeStyle = '#8E9294';
    g.beginPath(); g.moveTo(X(-90), 10); g.lineTo(X(-90), H - 26); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#8E9294'; g.fillText('z = −90 (ref.)', X(-90) + 4, 18);
    g.strokeStyle = '#1E40AF'; g.lineWidth = 2; g.beginPath();
    rows.forEach(function (r, k) { k ? g.lineTo(X(r.z), Y(r.smax)) : g.moveTo(X(r.z), Y(r.smax)); });
    g.stroke();
    rows.forEach(function (r) {
      g.fillStyle = '#14181C'; g.beginPath(); g.arc(X(r.z), Y(r.smax), 3, 0, 7); g.fill();
      g.fillText(fmt(r.smax, 2), X(r.z) - 10, Y(r.smax) - 7);
    });
    var peor = rows.reduce(function (a, b) { return b.smax > a.smax ? b : a; });
    var ref = rows.filter(function (r) { return r.z === -90; })[0];
    $('#i-perf-note').innerHTML = 'Nivel ' + nivel + ': la sección de referencia (z = −90 mm) da σ máx = ' +
      fmt(ref.smax, 2) + ' MPa (FS = ' + fmt(sy / ref.smax, 2) + '), igual a la comprobación documentada (' +
      fmt(COMP[nivel].sigma_maxima_MPa, 2) + ' MPa). La sección más desfavorable del perfil es z = ' + peor.z +
      ' mm con σ máx = ' + fmt(peor.smax, 2) + ' MPa (FS = ' + fmt(sy / peor.smax, 2) + ' con ' + NOMBRES[i] +
      ', fluencia asumida ' + fmt(sy, 0) + ' MPa). ' +
      '<span class="o o-teor">Cálculo propio</span> <span class="o o-cad">Secciones medidas sobre el sólido CAD</span>';
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
  /* ---------- M10 informe y exportación ---------- */
  function descarga(nombre, mime, contenido) {
    var b = new Blob([contenido], { type: mime });
    var u = URL.createObjectURL(b);
    var a = document.createElement('a');
    a.href = u; a.download = nombre;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(u); a.remove(); }, 200);
  }
  function armaInforme() {
    var ahora = new Date();
    var fecha = ahora.toLocaleDateString('es-CO') + ', ' + ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    var p = leeM(), r = ecDe(p.w, p), corr = leeCorr(), ra = corr ? ecDe(p.w, p, corr) : null;
    var nivel = $('#i-btns .on').dataset.n, c = COMP[nivel];
    var iMat = parseInt($('#i-mat').value, 10) / 5;
    var rows = perfilSigma(nivel);
    var h = [];
    h.push('<h1>PolyComp Studio v3.2 — Informe de resultados</h1>');
    h.push('<p class="sub">Generado en el navegador el ' + fecha + ' · Trabajo de grado UAO 2026 · Caso Pyrum Innovations AG · Compuesto PP + ThermoTireBlack® (rCB)</p>');
    h.push('<div class="warn"><b>Advertencias:</b> prototipo académico; no es un dispositivo médico validado. Los valores del compuesto son predicciones del modelo Halpin–Tsai con supuestos etiquetados, no mediciones (las fases experimentales F3–F8 no se ejecutaron). Los escenarios de ACV pertenecen al modelo europeo de Maga, Aryan y Blömer (2022) y no se extrapolan a Colombia. La comprobación ISO 10328 es analítica de primer orden: no sustituye el ensayo normalizado ni un análisis por elementos finitos.</div>');
    h.push('<div class="sec"><h2>1 · Formulaciones del compuesto (M01)</h2><table><thead><tr><th>Formulación</th><th>w (% p/p)</th><th>Vf (%)</th><th>ρc (g/cm³)</th><th>Ec (GPa)</th><th>ΔEc (%)</th><th>E esp.</th><th>Fluencia asumida (MPa)</th><th>Masa encaje (g)</th></tr></thead><tbody>');
    NOMBRES.forEach(function (n, i) {
      h.push('<tr><td>' + n + '</td><td class="mono">' + HAL.w[i] + '</td><td class="mono">' + fmt(HAL.Vf[i], 2) +
        '</td><td class="mono">' + fmt(HAL.rho[i], 3) + '</td><td class="mono">' + fmt(HAL.Ec[i], 3) +
        '</td><td class="mono">' + (i ? '+' + fmt(HAL.dEc[i], 2) : '0,00') + '</td><td class="mono">' + fmt(HAL.Eesp[i], 3) +
        '</td><td class="mono">' + fmt(FLU[n], 0) + '</td><td class="mono">' + fmt(MASAS[n], 0) + '</td></tr>');
    });
    h.push('</tbody></table><p class="nota">Volumen de material constante 307,4 cm³ (medido sobre el sólido CAD). La fluencia del compuesto es supuesto propio con base en literatura de PP cargado.</p></div>');
    h.push('<div class="sec"><h2>2 · Micromecánica Halpin–Tsai (M02)</h2><table><thead><tr><th>Parámetro</th><th>Valor</th></tr></thead><tbody>');
    h.push('<tr><td>Carga w activa</td><td class="mono">' + fmt(parseFloat($('#m-w').value), 1) + ' % p/p</td></tr>');
    h.push('<tr><td>Ef / Em / ξ</td><td class="mono">' + p.Ef + ' / ' + p.Em + ' MPa / ' + p.xi + '</td></tr>');
    h.push('<tr><td>ρf / ρm</td><td class="mono">' + p.rf + ' / ' + p.rm + ' g/cm³</td></tr>');
    h.push('<tr><td>Vf / ρc resultantes</td><td class="mono">' + fmt(r.Vf * 100, 2) + ' % / ' + fmt(r.rho, 3) + ' g/cm³</td></tr>');
    h.push('<tr><td>Ec base / Δ vs matriz / E específico</td><td class="mono">' + fmt(r.Ec / 1000, 3) + ' GPa / +' +
      fmt((r.Ec / p.Em - 1) * 100, 2) + ' % / ' + fmt(r.Ec / 1000 / r.rho, 3) + '</td></tr>');
    if (ra) h.push('<tr><td>Correcciones exploratorias (pv / k / a)</td><td class="mono">' + corr.pv + ' % / ' + corr.k +
      ' / ' + corr.a + ' → Ec corregido ' + fmt(ra.Ec / 1000, 3) + ' GPa (' + fmt((ra.Ec / r.Ec - 1) * 100, 1) + ' % vs base)</td></tr>');
    h.push('</tbody></table><p class="nota">Ef = 12 GPa y ξ = 2 son supuestos bibliográficos etiquetados; ρf = 1,80 g/cm³ es supuesto teórico (la SDS del productor declara la densidad verdadera como «Not determined»).' +
      (ra ? ' Las correcciones activas son un ejercicio de sensibilidad exploratorio, no mediciones.' : '') + '</p></div>');
    h.push('<div class="sec"><h2>3 · Comprobación analítica ISO 10328:2016 (M03)</h2><table><thead><tr><th>Magnitud</th><th>Nivel ' + nivel + '</th></tr></thead><tbody>');
    h.push('<tr><td>Carga axial F / momento M = F·e</td><td class="mono">' + fmt(c.carga_axial_N, 0) + ' N / ' +
      fmt(c.momento_flector_Nmm / 1000, 1) + ' N·m (e = ' + fmt(COMP.excentricidad_de_carga_asumida_mm, 0) + ' mm)</td></tr>');
    h.push('<tr><td>Sección de referencia</td><td class="mono">' + COMP.seccion_de_referencia + ' · A = ' +
      fmt(COMP.area_de_material_mm2, 1) + ' mm² · c = ' + fmt(COMP.fibra_maxima_mm, 1) + ' mm</td></tr>');
    h.push('<tr><td>σ axial / σ flex AP / σ flex ML / σ máx</td><td class="mono">' + fmt(c.sigma_axial_MPa, 3) + ' / ' +
      fmt(c.sigma_flexion_AP_MPa, 2) + ' / ' + fmt(c.sigma_flexion_ML_MPa, 2) + ' / ' + fmt(c.sigma_maxima_MPa, 2) + ' MPa</td></tr>');
    h.push('<tr><td>FS estático · formulación activa</td><td class="mono">' + fmt(c[FSKEY[iMat]], 2) + ' (' +
      NOMBRES[iMat] + ', fluencia asumida ' + fmt(FLU[NOMBRES[iMat]], 0) + ' MPa)</td></tr>');
    h.push('</tbody></table>');
    h.push('<table><thead><tr><th>Perfil σ(z)</th><th>A (mm²)</th><th>c (mm)</th><th>σ axial (MPa)</th><th>σ flex AP (MPa)</th><th>σ máx (MPa)</th><th>FS</th></tr></thead><tbody>');
    rows.forEach(function (q) {
      h.push('<tr><td class="mono">z = ' + q.z + ' mm</td><td class="mono">' + fmt(q.s.area_de_material_mm2, 1) +
        '</td><td class="mono">' + fmt(q.s.fibra_maxima_mm, 1) + '</td><td class="mono">' + fmt(q.sax, 2) +
        '</td><td class="mono">' + fmt(q.sap, 2) + '</td><td class="mono">' + fmt(q.smax, 2) +
        '</td><td class="mono">' + fmt(FLU[NOMBRES[iMat]] / q.smax, 2) + '</td></tr>');
    });
    h.push('</tbody></table><p class="nota">σ(z) = F/A(z) + M·c(z)/Ixx(z), M = F·e constante. Estimación analítica propia de primer orden sobre las nueve secciones medidas en el sólido CAD; el dimensionamiento real de una prótesis de PP lo gobiernan creep y fatiga, no la rotura estática.</p></div>');
    h.push('<div class="sec"><h2>4 · Geometría del encaje (M04)</h2><table><thead><tr><th>Parámetro</th><th>Valor</th></tr></thead><tbody>');
    h.push('<tr><td>Modelo</td><td class="mono">ENCAJE_TRANSTIBIAL_UAO · boca ML/AP 114,9 / 95,0 mm · profundidad útil 180 mm · pared 5,0–8,4 mm · flexión inicial 5°</td></tr>');
    h.push('<tr><td>Volumen / caja envolvente</td><td class="mono">307,4 cm³ / 114,9 × 97,9 × 189,0 mm</td></tr>');
    h.push('<tr><td>Masa estimada por formulación</td><td class="mono">' + NOMBRES.map(function (n, i) {
      return HAL.w[i] + ' %: ' + fmt(MASAS[n], 0) + ' g';
    }).join(' · ') + '</td></tr>');
    h.push('<tr><td>Teselación del visor</td><td class="mono">' + ($('#st-tris').textContent || '—') + ' triángulos a 0,15 mm (GLB exportado del B-rep)</td></tr>');
    h.push('</tbody></table></div>');
    h.push('<div class="sec"><h2>5 · Análisis de ciclo de vida (M06)</h2><table><thead><tr><th>Escenario</th><th>GWP100 (kg CO₂-eq/t NFU)</th></tr></thead><tbody>');
    D.acv.forEach(function (a, i) {
      h.push('<tr><td>E' + (i + 1) + '. ' + a.esc.replace(/^Escenario \d+: /, '') + '</td><td class="mono">' +
        (a.gwp > 0 ? '+' : '') + a.gwp + '</td></tr>');
    });
    h.push('</tbody></table><p class="nota">Resultados del modelo europeo de Maga, Aryan y Blömer (2022, Fraunhofer UMSICHT): seis escenarios de pirólisis de NFU. No extrapolados a Colombia.</p></div>');
    var cnt = {};
    TRAZA.forEach(function (r) { cnt[r[2]] = (cnt[r[2]] || 0) + 1; });
    h.push('<div class="sec"><h2>6 · Trazabilidad (M05)</h2><p class="nota">' + TRAZA.length +
      ' datos con procedencia etiquetada: ' + Object.keys(cnt).map(function (k) {
        return ETIQ[k][0] + ' ' + cnt[k];
      }).join(' · ') +
      '. Fuentes primarias del productor: ficha técnica TDS PI-ADA-PYR-004 rev. 6 (30/07/2026), ficha de seguridad SDS-TTB-EN v7 (08/07/2026) y correspondencia 29/09–11/11/2026 (Pyrum Innovations AG, 2026). Son declaraciones del productor, no validación científica independiente.</p></div>');
    h.push('<div class="pie">PolyComp Studio v3.2 · 2026-11-18 · repositorio POLYCOMPSTudio (rama main) · banco de datos datos.js verificado sobre el sólido CAD. Informe generado localmente en el navegador: la página no almacena ni envía datos a ningún servidor.</div>');
    return h.join('');
  }
  $('#b-informe').addEventListener('click', function () {
    $('#informe').innerHTML = armaInforme();
    document.body.classList.add('print-mode');
    window.print();
    setTimeout(function () { document.body.classList.remove('print-mode'); }, 600);
  });
  window.addEventListener('afterprint', function () { document.body.classList.remove('print-mode'); });
  function csvLine(arr) {
    return arr.map(function (v) {
      v = String(v);
      return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    }).join(';');
  }
  function armaCSV() {
    var L = [];
    L.push('# PolyComp Studio v3.2 — banco de datos verificado · generado ' + new Date().toLocaleString('es-CO'));
    L.push('');
    L.push('FORMULACIONES');
    L.push(csvLine(['Formulación', 'w (% p/p)', 'Vf (%)', 'rho_c (g/cm3)', 'Ec (GPa)', 'dEc vs matriz (%)', 'E específico', 'Fluencia asumida (MPa)', 'Masa encaje (g)']));
    NOMBRES.forEach(function (n, i) {
      L.push(csvLine([n, HAL.w[i], HAL.Vf[i], HAL.rho[i], HAL.Ec[i], i ? HAL.dEc[i] : 0, HAL.Eesp[i], FLU[n], MASAS[n]]));
    });
    L.push('');
    L.push('SECCIONES ESTRUCTURALES (medidas sobre el sólido CAD)');
    L.push(csvLine(['z (mm)', 'A (mm2)', 'Ixx AP (mm4)', 'Iyy ML (mm4)', 'c fibra máxima (mm)', 'espesor medio pared (mm)', 'perímetro exterior (mm)']));
    Object.keys(D.secciones).forEach(function (z) {
      var s = D.secciones[z];
      L.push(csvLine([z.replace('z=', ''), s.area_de_material_mm2, s.Ixx_mm4_flexion_AP, s.Iyy_mm4_flexion_ML,
        s.fibra_maxima_mm, s.espesor_medio_de_pared_mm, s.perimetro_exterior_mm]));
    });
    L.push('');
    L.push('COMPROBACIÓN ANALÍTICA ISO 10328 (sección z = -90 mm, e = 25 mm)');
    L.push(csvLine(['Nivel', 'F (N)', 'M (N·mm)', 'σ axial (MPa)', 'σ flex AP (MPa)', 'σ flex ML (MPa)', 'σ máx (MPa)', 'FS PP virgen', 'FS +5%', 'FS +10%', 'FS +15%']));
    ['P5', 'P6'].forEach(function (n) {
      var c = COMP[n];
      L.push(csvLine([n, c.carga_axial_N, c.momento_flector_Nmm, c.sigma_axial_MPa, c.sigma_flexion_AP_MPa,
        c.sigma_flexion_ML_MPa, c.sigma_maxima_MPa, c.FS_PP_virgen, c.FS_PP_mas_5_pct_TTB, c.FS_PP_mas_10_pct_TTB, c.FS_PP_mas_15_pct_TTB]));
    });
    L.push('');
    L.push('PERFIL ANALÍTICO σ(z) — nivel P6');
    L.push(csvLine(['z (mm)', 'σ axial (MPa)', 'σ flex AP (MPa)', 'σ máx (MPa)']));
    perfilSigma('P6').forEach(function (q) {
      L.push(csvLine([q.z, q.sax.toFixed(3), q.sap.toFixed(3), q.smax.toFixed(3)]));
    });
    L.push('');
    L.push('ACV 2022 (Maga, Aryan y Blömer — no extrapolado a Colombia)');
    L.push(csvLine(['Escenario', 'GWP100 (kg CO2-eq/t NFU)']));
    D.acv.forEach(function (a) { L.push(csvLine([a.esc, a.gwp])); });
    L.push('');
    L.push('TRAZABILIDAD');
    L.push(csvLine(['Dato', 'Valor', 'Origen', 'Fuente']));
    TRAZA.forEach(function (r) { L.push(csvLine(r)); });
    return '\ufeff' + L.join('\r\n');
  }
  $('#b-csv').addEventListener('click', function () {
    descarga('polycomp_studio_datos_v3-2.csv', 'text/csv;charset=utf-8', armaCSV());
  });

  pintaM(); pintaACV();
})();
