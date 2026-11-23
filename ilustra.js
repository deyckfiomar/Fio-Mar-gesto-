/* Fio-Mar Gestor — ilustrações dos testes do Diagnóstico (2.38.0; MAF, detonação, velas e vazão na 2.40.0)
   Pequenos desenhos do "valor certo": forma de onda no osciloscópio, relógio do manômetro, escala do multímetro.
   window.DGILU[idDoTeste] = { svg, leg }  → usado no cartão do teste (diagnostico.js, "Como fazer e valor esperado"). */
(function (G) {
  'use strict';
  const f = (n) => String(Math.round(n * 10) / 10).replace('.', ',');
  const P = (cx, cy, r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)];

  /* ---------- relógio (manômetro, vacuômetro, compressômetro) ---------- */
  function relogio(o) {
    const cx = 110, cy = 92, R = 70, A0 = 135, SW = 270, ang = (v) => A0 + (Math.min(Math.max(v, o.min), o.max) - o.min) / (o.max - o.min) * SW;
    const arco = (v1, v2, r) => { const a1 = ang(v1), a2 = ang(v2), [x1, y1] = P(cx, cy, r, a1), [x2, y2] = P(cx, cy, r, a2); return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${a2 - a1 > 180 ? 1 : 0} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`; };
    let s = `<path d="${arco(o.min, o.max, R)}" class="il-g" stroke-width="2" fill="none"/>`;
    (o.zonas || []).forEach(([a, b, c]) => { s += `<path d="${arco(a, b, R - 6)}" fill="none" stroke-width="10" class="il-z-${c}"/>`; });
    for (let v = o.min; v <= o.max + 1e-9; v += o.passo) {
      const a = ang(v), [x1, y1] = P(cx, cy, R, a), [x2, y2] = P(cx, cy, R - 12, a), [tx, ty] = P(cx, cy, R + 13, a);
      s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="il-g" stroke-width="2"/>`;
      s += `<text x="${tx.toFixed(1)}" y="${(ty + 4).toFixed(1)}" text-anchor="middle" class="il-t" font-size="11">${f(v)}</text>`;
    }
    const [nx, ny] = P(cx, cy, R - 16, ang(o.val));
    s += `<line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" class="il-n" stroke-width="3.5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="6" class="il-nf"/>`;
    s += `<text x="${cx}" y="${cy + 30}" text-anchor="middle" class="il-v" font-size="17" font-weight="800">${o.txt}</text><text x="${cx}" y="${cy + 46}" text-anchor="middle" class="il-t" font-size="11">${o.un}</text>`;
    const lad = o.lado ? `<g font-size="14">${o.lado.map((l, i) => `<text x="226" y="${30 + i * 21}" class="${l[1] || 'il-t'}">${l[0]}</text>`).join('')}</g>` : '';
    return `<svg viewBox="0 0 ${o.lado ? 400 : 220} 160" role="img" aria-label="${o.aria}">${s}${lad}</svg>`;
  }

  /* ---------- tela de osciloscópio / gráfico ---------- */
  function tela(o) {
    const W = 320, H = o.h || 140, X0 = o.x0 || 34, Y0 = 10, X1 = W - 8, Y1 = H - 22, y = (v) => Y1 - (v - o.ymin) / (o.ymax - o.ymin) * (Y1 - Y0), x = (t) => X0 + t * (X1 - X0);
    let s = `<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" rx="4" class="il-bg"/>`;
    for (let i = 1; i < 6; i++) s += `<line x1="${x(i / 6).toFixed(1)}" y1="${Y0}" x2="${x(i / 6).toFixed(1)}" y2="${Y1}" class="il-g" stroke-width="1"/>`;
    (o.ylin || []).forEach((v) => { s += `<line x1="${X0}" y1="${y(v).toFixed(1)}" x2="${X1}" y2="${y(v).toFixed(1)}" class="il-g" stroke-width="1"/><text x="${X0 - 4}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" class="il-t" font-size="10.5">${o.yfmt ? o.yfmt(v) : f(v)}</text>`; });
    (o.faixas || []).forEach(([a, b]) => { s += `<rect x="${X0}" y="${y(b).toFixed(1)}" width="${X1 - X0}" height="${(y(a) - y(b)).toFixed(1)}" class="il-zb"/>`; });
    (o.ondas || []).forEach((w) => { s += `<polyline points="${w.p.map(([t, v]) => x(t).toFixed(1) + ',' + y(v).toFixed(1)).join(' ')}" fill="none" class="${w.cls || 'il-s'}" stroke-width="${w.sw || 2.4}" stroke-linejoin="round" stroke-linecap="round"/>`; });
    (o.notas || []).forEach(([t, v, txt, al, cls]) => { s += `<text x="${x(t).toFixed(1)}" y="${y(v).toFixed(1)}" text-anchor="${al || 'middle'}" class="${cls || 'il-v'}" font-size="11" font-weight="700">${txt}</text>`; });
    if (o.xleg) s += `<text x="${(X0 + X1) / 2}" y="${H - 6}" text-anchor="middle" class="il-t" font-size="10.5">${o.xleg}</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${o.aria}">${s}</svg>`;
  }
  const pts = (n, fn) => Array.from({ length: n + 1 }, (_, i) => [i / n, fn(i / n)]);

  /* ---------- escala horizontal (multímetro, scanner) ---------- */
  function escala(o) {
    const X0 = 16, X1 = 304, x = (v) => X0 + (v - o.min) / (o.max - o.min) * (X1 - X0);
    let s = `<rect x="${X0}" y="44" width="${X1 - X0}" height="14" rx="7" class="il-bg"/>`;
    (o.zonas || []).forEach(([a, b, c]) => { s += `<rect x="${x(a).toFixed(1)}" y="44" width="${(x(b) - x(a)).toFixed(1)}" height="14" class="il-z-${c}f"/>`; });
    (o.marcas || []).forEach((v) => { s += `<text x="${x(v).toFixed(1)}" y="76" text-anchor="middle" class="il-t" font-size="11">${o.fmt ? o.fmt(v) : f(v)}</text><line x1="${x(v).toFixed(1)}" y1="58" x2="${x(v).toFixed(1)}" y2="63" class="il-g" stroke-width="1.5"/>`; });
    (o.pinos || []).forEach(([v, txt], i) => { const xx = x(v).toFixed(1); s += `<path d="M${xx} 42 l-6 -9 h12 z" class="il-nf"/><text x="${xx}" y="${i % 2 ? 98 : 26}" text-anchor="middle" class="il-v" font-size="11.5" font-weight="700">${txt}</text>`; });
    return `<svg viewBox="0 0 320 ${o.pinos && o.pinos.length > 1 ? 104 : 84}" role="img" aria-label="${o.aria}">${s}</svg>`;
  }

  /* ---------- visor de multímetro ---------- */
  function visor(o) {
    return `<svg viewBox="0 0 320 92" role="img" aria-label="${o.aria}"><rect x="8" y="8" width="150" height="76" rx="12" class="il-bg" stroke-width="2"/><rect x="20" y="20" width="126" height="40" rx="5" class="il-lcd"/>
      <text x="138" y="50" text-anchor="end" font-size="22" font-weight="800" class="il-lcdt" font-family="ui-monospace,monospace">${o.lcd}</text><text x="83" y="76" text-anchor="middle" font-size="10.5" class="il-t">${o.modo}</text>
      ${o.lado.map((l, i) => `<text x="172" y="${30 + i * 20}" font-size="12" class="${l[1] || 'il-t'}">${l[0]}</text>`).join('')}</svg>`;
  }

  /* ================= desenhos de cada teste ================= */
  const L = {};
  // Injetor: 12 V → 0 V (bico aberto) → pico de desligamento → volta a 12 V
  L.injwave = { svg: tela({ x0: 40, aria: 'Forma de onda do injetor', ymin: -5, ymax: 75, ylin: [0, 12, 60], yfmt: (v) => v + ' V', xleg: 'tempo (≈ 1 ms por divisão)',
    ondas: [{ p: [[0, 12], [.18, 12], [.185, 0.4], [.5, 0.6], [.505, 60], [.515, 64], [.53, 40], [.56, 20], [.6, 13], [.66, 11.4], [.72, 12.3], [1, 12]] }],
    notas: [[.35, 3.5, 'bico aberto 2–4 ms'], [.53, 69, 'pico 35–80 V', 'start'], [.01, 19, 'fechado', 'start']] }),
    leg: 'Bico fechado em 12 V. Ao abrir, cai a ~0 V. Ao fechar, o pico de desligamento passa de 35 V e é parecido em todos os bicos.' };
  // Compressão a seco
  L.compdry = { svg: relogio({ aria: 'Compressômetro com 170 psi', min: 0, max: 300, passo: 50, val: 170, txt: '≈ 170 psi', un: 'psi (≈ 12 bar)', zonas: [[0, 100, 'r'], [100, 120, 'a'], [120, 200, 'g']],
    lado: [['Normal: 120–200 psi', 'il-ok'], ['(8,5–14 bar)'], ['Diferença entre'], ['cilindros: até 10%'], ['Abaixo de 100 psi', 'il-bad'], ['= problema', 'il-bad']] }),
    leg: 'Motor quente, borboleta toda aberta, 4 a 6 compressões por cilindro. O valor exato depende do motor: compare os cilindros entre si.' };
  // Compressão molhada
  L.compwet = { svg: relogio({ aria: 'Compressão seca e molhada', min: 0, max: 300, passo: 50, val: 160, txt: '110 → 160', un: 'psi: seco → molhado', zonas: [[120, 200, 'g']],
    lado: [['Subiu bastante', 'il-ok'], ['= anéis gastos'], [''], ['Não mudou', 'il-bad'], ['= válvula ou junta']] }),
    leg: 'Pingue uma colher de óleo no cilindro e meça de novo. O óleo veda os anéis: se a pressão sobe, o problema está nos anéis.' };
  L.map = { svg: tela({ x0: 50, aria: 'Sensor MAP em kPa', ymin: 0, ymax: 110, ylin: [0, 30, 100], yfmt: (v) => v + ' kPa', xleg: 'desligado → lenta → acelerada → soltou',
    faixas: [[25, 40]],
    ondas: [{ p: [[0, 100], [.14, 100], [.2, 33], [.46, 33], [.5, 92], [.6, 92], [.64, 18], [.74, 20], [.8, 33], [1, 33]] }],
    notas: [[.33, 46, 'lenta 25–40'], [.55, 104, 'aberta ≈ 95'], [.69, 10, 'desacel. < 20']] }),
    leg: 'Motor desligado ≈ 100 kPa ao nível do mar (menos em cidade alta). Marcha lenta 25–40 kPa. Em tensão: lenta ≈ 1–1,5 V, aberta ≈ 4–4,5 V.' };
  L.o2 = { svg: tela({ aria: 'Sonda lambda oscilando', ymin: 0, ymax: 1, ylin: [0.1, 0.45, 0.9], yfmt: (v) => f(v) + ' V', xleg: '≈ 1 segundo',
    ondas: [{ p: pts(120, (t) => 0.5 + 0.4 * Math.sin(t * Math.PI * 2 * 3.2)) }], notas: [[.97, .95, 'rica', 'end'], [.97, .03, 'pobre', 'end', 'il-t']] }),
    leg: 'Oscila entre 0,1 e 0,9 V, várias vezes por segundo, com subidas rápidas. Parada alta = rica; parada baixa = pobre ou sonda morta.' };
  L.o2post = { svg: tela({ aria: 'Sonda pré e pós-catalisador', ymin: 0, ymax: 1, ylin: [0.1, 0.45, 0.9], yfmt: (v) => f(v) + ' V',
    ondas: [{ p: pts(120, (t) => 0.5 + 0.38 * Math.sin(t * Math.PI * 2 * 3.2)), cls: 'il-s2', sw: 1.6 }, { p: pts(40, (t) => 0.62 + 0.02 * Math.sin(t * 9)) }],
    notas: [[.02, .7, 'pós (estável)', 'start'], [.02, .98, 'pré', 'start', 'il-t']] }),
    leg: 'A pós fica quase parada entre 0,45 e 0,7 V. Se ela copia a pré, o catalisador não está funcionando.' };
  // TPS / pedal (2.42.1, correção do dono): depende do carro. 1 sinal no TPS separado; 2 sinais na borboleta eletrônica; 2 pistas no pedal
  const tpsT = (aria, tt, ondas, notas) => tela({ aria, h: 128, ymin: 0, ymax: 6.4, ylin: [0.5, 2.5, 4.5], yfmt: (v) => f(v) + ' V', ondas, notas: [[.015, 5.75, tt, 'start'], ...notas] });
  const sobe = (a, b) => [[0, a], [.08, a], [.48, b], [.56, b], [.94, a], [1, a]];
  L.tps = { svg:
    tpsT('TPS separado: um sinal', 'A) TPS separado (borboleta a cabo): 1 sinal', [{ p: sobe(.6, 4.4) }], [[.5, -1.05, 'fechado ≈ 0,5 V → aberto ≈ 4,5 V → fechado', 'middle', 'il-v il-b1']]) +
    tpsT('Borboleta eletrônica: dois sinais', 'B) Borboleta eletrônica: TPS1 e TPS2', [{ p: sobe(.6, 4.4) }, { p: sobe(4.4, .6), cls: 'il-s2' }], [[.27, -1.05, '— TPS1 sobe', 'middle', 'il-v il-b1'], [.73, -1.05, '— TPS2 desce (espelhado)', 'middle', 'il-v il-b2']]) +
    tpsT('Pedal do acelerador: duas pistas', 'C) Pedal do acelerador: APP1 e APP2', [{ p: sobe(.75, 4.2) }, { p: sobe(.38, 2.1), cls: 'il-s2' }], [[.22, -1.05, '— APP1', 'middle', 'il-v il-b1'], [.66, -1.05, '— APP2 (metade do APP1)', 'middle', 'il-v il-b2']]),
    leg: 'Depende do carro. A) TPS separado, borboleta a cabo: um sinal só, liso, de ≈ 0,5 V fechado a ≈ 4,5 V aberto. B) Corpo de borboleta eletrônico: o sensor fica dentro do corpo e tem 2 sinais (TPS1 e TPS2). C) Pedal eletrônico: 2 pistas (APP1 e APP2). Nos sinais duplos, um pode subir enquanto o outro desce (espelhado) ou ser a metade do outro, conforme a montadora; os dois mudam juntos, sem degraus nem quedas a zero, e a ECU compara um com o outro.' };
  // CKP (roda 60-2) e CMP
  L.ckpcmp = { svg: tela({ aria: 'Sincronismo CKP e CMP', h: 150, ymin: -2, ymax: 9, xleg: 'falha da roda fônica alinhada com o pulso de fase',
    ondas: [{ p: (() => { const a = []; for (let i = 0; i <= 300; i++) { const t = i / 300, gap = t > .4 && t < .46; a.push([t, gap ? 6 : 6 + 1.6 * Math.sin(t * Math.PI * 2 * 26)]); } return a; })() },
      { p: [[0, 0], [.38, 0], [.38, 2.5], [.52, 2.5], [.52, 0], [1, 0]], cls: 'il-s2' }],
    notas: [[.43, 8.6, 'falha'], [.02, 8.6, 'CKP', 'start', 'il-t'], [.02, 3.3, 'CMP', 'start', 'il-t']] }),
    leg: 'Compare a posição do pulso de fase (CMP) com a falha dos dentes (CKP) no padrão do motor. Deslocado = ponto fora ou corrente esticada.' };
  L.ign = { svg: tela({ x0: 44, aria: 'Forma de onda do primário da ignição', ymin: -60, ymax: 430, ylin: [0, 350], yfmt: (v) => v + ' V', xleg: '≈ 1 ms por divisão',
    ondas: [{ p: [[0, 12], [.15, 12], [.16, 2], [.36, 4], [.365, 360], [.375, 60], [.39, 40], [.62, 36], [.64, 80], [.66, -10], [.69, 30], [.72, 6], [.76, 16], [.8, 12], [1, 12]] }],
    notas: [[.26, -38, 'carga (dwell)'], [.38, 400, 'pico 250–400 V', 'start'], [.53, 120, 'queima 1–2 ms', 'start'], [.8, -38, 'oscilações']] }),
    leg: 'Pico de 250 a 400 V, linha de queima de 1 a 2 ms e algumas oscilações no fim. Compare todos os cilindros.' };
  L.relcomp = { svg: tela({ aria: 'Compressão relativa pela corrente', ymin: 0, ymax: 260, ylin: [0, 200], yfmt: (v) => v + ' A', xleg: 'partida com injeção desligada',
    ondas: [{ p: pts(240, (t) => 140 + 60 * Math.pow(Math.max(0, Math.sin(t * Math.PI * 8)), 3)) }], notas: [[.5, 238, 'picos com a mesma altura']] }),
    leg: 'Cada pico é um cilindro comprimindo. Todos iguais (até ~10% de diferença). Um pico mais baixo = cilindro fraco.' };
  L.pumpcur = { svg: tela({ aria: 'Corrente da bomba', ymin: 0, ymax: 10, ylin: [0, 4, 8], yfmt: (v) => v + ' A', xleg: 'motor funcionando',
    ondas: [{ p: pts(240, (t) => 5.6 + 0.5 * Math.sin(t * Math.PI * 2 * 14)) }], notas: [[.5, 8.9, 'ondulação regular · 4–8 A']] }),
    leg: 'Ondas iguais e corrente entre 4 e 8 A. Corrente alta = bomba forçando. Onda irregular ou com falhas = coletor da bomba gasto.' };
  L.ripple = { svg: tela({ aria: 'Ondulação do alternador', ymin: -1, ymax: 1, ylin: [-0.5, 0, 0.5], yfmt: (v) => f(v) + ' V', xleg: 'AC, 2.000 rpm, faróis ligados',
    ondas: [{ p: pts(240, (t) => 0.22 * Math.abs(Math.sin(t * Math.PI * 18)) - 0.11) }], notas: [[.5, .8, 'ondas iguais, até 0,5 V']] }),
    leg: 'Ondulação baixa e igual. Uma onda faltando ou bem maior que as outras = diodo do alternador com defeito.' };
  L.can = { svg: tela({ aria: 'Rede CAN', ymin: 0.5, ymax: 4.5, ylin: [1.5, 2.5, 3.5], yfmt: (v) => f(v) + ' V',
    ondas: (() => { const b = [0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 1], h = [], l = []; b.forEach((d, i) => { const t0 = i / b.length, t1 = (i + 1) / b.length; h.push([t0, d ? 3.5 : 2.5], [t1, d ? 3.5 : 2.5]); l.push([t0, d ? 1.5 : 2.5], [t1, d ? 1.5 : 2.5]); }); return [{ p: h }, { p: l, cls: 'il-s2' }]; })(),
    notas: [[.98, 4.1, 'CAN-H', 'end'], [.98, 0.8, 'CAN-L', 'end', 'il-t']] }),
    leg: 'CAN-H sobe de 2,5 para 3,5 V enquanto CAN-L desce para 1,5 V, como num espelho. Resistência entre os dois fios (bateria desligada) ≈ 60 Ω.' };
  L.fpress = { svg: relogio({ aria: 'Manômetro de combustível', min: 0, max: 6, passo: 1, val: 3, txt: '≈ 3 bar', un: 'bar (≈ 43 psi)', zonas: [[2.5, 4, 'g']],
    lado: [['Com retorno:', 'il-ok'], ['2,5–3,0 bar'], ['Sem retorno:', 'il-ok'], ['3,5–4,0 bar'], ['Confira o manual']] }),
    leg: 'Medida em marcha lenta. Em sistemas com regulador no retorno, a pressão sobe ~0,5 bar ao tirar a mangueira de vácuo.' };
  L.fhold = { svg: tela({ x0: 42, aria: 'Retenção de pressão', ymin: 0, ymax: 4, ylin: [0, 1, 2, 3], yfmt: (v) => v + ' bar', xleg: 'desliga o motor → 10 a 20 minutos',
    ondas: [{ p: [[0, 3], [.15, 3], [.2, 2.8], [1, 2.3]] }, { p: [[.15, 3], [.2, 2.4], [.4, 1.2], [.7, 0.3], [1, .1]], cls: 'il-bad', sw: 1.8 }],
    notas: [[.98, 2.6, 'certo: cai devagar', 'end'], [.98, 1.1, 'errado: cai rápido', 'end', 'il-bad']] }),
    leg: 'A pressão fica quase parada depois de desligar. Queda rápida = bico pingando, regulador ou válvula da bomba.' };
  L.faccel = { svg: tela({ x0: 42, aria: 'Pressão em aceleração', ymin: 0, ymax: 4, ylin: [0, 1, 2, 3], yfmt: (v) => v + ' bar', xleg: 'acelerar forte',
    ondas: [{ p: [[0, 3], [.4, 3], [.45, 3.4], [.7, 3.4], [.75, 3], [1, 3]] }, { p: [[.4, 3], [.48, 2.1], [.7, 2], [.76, 3]], cls: 'il-bad', sw: 1.6 }],
    notas: [[.58, 3.75, 'certo: mantém ou sobe'], [.58, 1.6, 'errado: cai', 'middle', 'il-bad']] }),
    leg: 'Acelerando, a pressão se mantém (ou sobe um pouco nos sistemas com retorno). Se cair, a bomba está fraca ou o filtro entupido.' };
  L.vacidle = { svg: relogio({ aria: 'Vacuômetro em marcha lenta', min: 0, max: 30, passo: 5, val: 19, txt: '17–21', un: 'inHg, ponteiro parado', zonas: [[17, 21, 'g']],
    lado: [['Normal: 17–21 inHg', 'il-ok'], ['(−0,57 a −0,71 bar)'], ['Baixo e parado'], ['= ponto ou entrada de ar'], ['Ponteiro batendo', 'il-bad'], ['= válvula', 'il-bad']] }),
    leg: 'Motor quente, em marcha lenta, mangueira direto no coletor. O ponteiro deve ficar firme.' };
  L.vac2500 = { svg: tela({ x0: 50, aria: 'Vácuo a 2.500 rpm', ymin: 0, ymax: 25, ylin: [0, 10, 20], yfmt: (v) => v + ' inHg', xleg: 'segurar 2.500 rpm por ~1 minuto',
    ondas: [{ p: [[0, 19], [.15, 19], [.2, 21], [1, 21]] }, { p: [[.2, 21], [.5, 15], [1, 8]], cls: 'il-bad', sw: 1.8 }],
    notas: [[.98, 22.8, 'certo: igual ou maior', 'end'], [.8, 6, 'escape entupido', 'middle', 'il-bad']] }),
    leg: 'A 2.500 rpm o vácuo fica igual ou maior que na marcha lenta. Caindo aos poucos = catalisador ou escapamento entupido.' };
  L.leak = { svg: relogio({ aria: 'Teste de vazamento de cilindro', min: 0, max: 100, passo: 20, val: 8, txt: '≈ 8%', un: 'de vazamento', zonas: [[0, 15, 'g'], [15, 30, 'a'], [30, 100, 'r']],
    lado: [['Bom: até 10–15%', 'il-ok'], ['Ar no escape: válvula'], ['Ar na admissão: válvula'], ['Ar no cárter: anéis'], ['Bolhas no radiador:'], ['junta / cabeçote']] }),
    leg: 'Pistão no ponto morto superior da compressão. Escute por onde o ar sai para saber a causa.' };
  L.oilpress = { svg: relogio({ aria: 'Manômetro de óleo', min: 0, max: 8, passo: 1, val: 3.8, txt: '3–5 bar', un: 'a 3.000 rpm', zonas: [[0, 1, 'r'], [1, 3, 'a'], [3, 5, 'g']],
    lado: [['Lenta quente: ≥ 1 bar', 'il-ok'], ['3.000 rpm: 3–5 bar', 'il-ok'], ['Abaixo de 1 bar', 'il-bad'], ['= bomba, folga ou óleo', 'il-bad']] }),
    leg: 'Medir com o motor quente, no lugar do interruptor de pressão do óleo.' };
  L.coolpress = { svg: relogio({ aria: 'Pressão do arrefecimento', min: 0, max: 2.5, passo: 0.5, val: 1.2, txt: '≈ 1,2 bar', un: 'parado por 15 min', zonas: [[0.9, 1.5, 'g']],
    lado: [['Pressão da tampa:', 'il-ok'], ['≈ 0,9–1,5 bar'], ['(vem escrita nela)'], ['Caiu = vazamento', 'il-bad']] }),
    leg: 'Bombear até a pressão da tampa e esperar 15 minutos. O ponteiro não pode cair.' };
  L.bat = { svg: escala({ aria: 'Tensões da bateria', min: 8, max: 16, marcas: [8, 10, 12, 14, 16], fmt: (v) => v + ' V', zonas: [[9.6, 11, 'a'], [12.4, 12.8, 'g'], [13.8, 14.7, 'g']],
    pinos: [[9.6, 'partida ≥ 9,6'], [12.6, 'repouso 12,6'], [14.2, 'ligado 13,8–14,7']] }),
    leg: 'Repouso (carro parado há algumas horas) 12,6 V. Na partida não pode cair abaixo de 9,6 V. Motor ligado: 13,8 a 14,7 V.' };
  L.ft = { svg: escala({ aria: 'Correções de combustível', min: -25, max: 25, marcas: [-25, -10, 0, 10, 25], fmt: (v) => (v > 0 ? '+' : '') + v + '%', zonas: [[-10, 10, 'g'], [-25, -10, 'a'], [10, 25, 'a']],
    pinos: [[-18, 'rica'], [3, 'STFT + LTFT'], [18, 'pobre']] }),
    leg: 'Some a correção curta com a longa. Entre −10% e +10% está bom. Muito positivo = mistura pobre (falta combustível ou entra ar).' };
  L.res = { svg: visor({ aria: 'Multímetro medindo injetor', lcd: '14,2 Ω', modo: 'Ω · bico injetor', lado: [['Injetor: 12–16 Ω', 'il-ok'], ['(baixa imped.: 2–5 Ω)'], ['Bobina primário: 0,4–2 Ω'], ['Fora disso = trocar', 'il-bad']] }),
    leg: 'Medir com o conector solto, nos dois terminais do componente. Veja a aba Valores para outros sensores.' };
  L.draw = { svg: visor({ aria: 'Corrente de fuga', lcd: '0,03 A', modo: 'A · em série no negativo', lado: [['Normal: abaixo de 50 mA', 'il-ok'], ['Espere os módulos'], ['dormirem (até 20 min)'], ['Acima: procurar fusível', 'il-bad']] }),
    leg: 'Multímetro em série no cabo negativo, carro trancado. Para achar o circuito, meça a queda de tensão em cima de cada fusível.' };
  L.drop = { svg: visor({ aria: 'Queda de tensão', lcd: '0,18 V', modo: 'V · durante a partida', lado: [['Positivo: até 0,5 V', 'il-ok'], ['Massas: até 0,3 V', 'il-ok'], ['Massa sensor: 0,1 V', 'il-ok'], ['Acima = mau contato', 'il-bad']] }),
    leg: 'Pontas nas duas pontas do mesmo cabo, com o circuito funcionando. Quanto menor, melhor.' };
  L.refgnd = { svg: visor({ aria: 'Referência de 5 volts', lcd: '5,01 V', modo: 'V · ignição ligada', lado: [['Referência: 4,9–5,1 V', 'il-ok'], ['Massa do sensor:'], ['até 0,1 V', 'il-ok'], ['Referência baixa = curto', 'il-bad']] }),
    leg: 'Conector do sensor solto, ignição ligada. Referência entre o fio de 5 V e a massa do motor.' };

  /* ---------- 2.40.0: MAF, detonação, velas e vazão ---------- */
  // MAF: lenta baixa, sobe na hora ao acelerar e volta
  L.maf = { svg: tela({ x0: 44, aria: 'Sensor MAF em g/s', ymin: 0, ymax: 30, ylin: [0, 10, 20], yfmt: (v) => v + ' g/s', xleg: 'lenta → acelerada rápida → solta (motor 1.6)',
    faixas: [[2.4, 4]],
    ondas: [{ p: [[0, 3.2], [.3, 3.2], [.34, 18], [.38, 23], [.44, 22], [.5, 9], [.56, 4], [.62, 3.2], [1, 3.2]] },
      { p: [[.3, 3.2], [.4, 8], [.48, 11], [.56, 6], [.66, 3.4]], cls: 'il-bad', sw: 1.8 }],
    notas: [[.14, 7, 'lenta 2,4–4'], [.4, 26.5, 'sobe na hora'], [.8, 9, 'errado: sobe pouco', 'middle', 'il-bad']] }),
    leg: 'Marcha lenta ≈ 1,5–2,5 g/s por litro (motor 1.6 ≈ 2,4–4 g/s). Acelerando forte, sobe na hora e sem degraus. Sobe pouco ou devagar = sensor sujo ou entrada de ar depois dele.' };
  // Sensor de detonação: linha parada e um surto a cada batida
  L.knock = { svg: tela({ x0: 40, aria: 'Sinal do sensor de detonação', ymin: -1.5, ymax: 1.8, ylin: [-1, 0, 1], yfmt: (v) => f(v) + ' V', xleg: 'bater de leve no bloco, perto do sensor',
    ondas: [{ p: (() => { const a = [], bat = [.18, .5, .8]; for (let i = 0; i <= 400; i++) { const t = i / 400; let v = 0.03 * Math.sin(t * 300); bat.forEach((b) => { if (t >= b && t < b + .12) { const d = t - b; v += 1.1 * Math.exp(-d * 38) * Math.sin(d * 520); } }); a.push([t, v]); } return a; })() }],
    notas: [[.2, 1.45, 'batida', 'start'], [.52, 1.45, 'batida', 'start'], [.82, 1.45, 'batida', 'start']] }),
    leg: 'Parado, o sinal fica perto de 0 V. Cada batida gera um surto (meio volt a alguns volts) que some rápido. Sem surto = sensor ou fio. Aperto conforme o manual (em geral 20–25 N·m): frouxo ou apertado demais muda o sinal.' };
  // Velas: cores lado a lado
  L.plugs = { svg: (() => {
    const v = (x, c, nome, diz, cls, extra) => `<g transform="translate(${x} 0)">
      <rect x="22" y="6" width="36" height="26" rx="3" class="il-bg"/>
      <path d="M18 32 h44 v40 h-44 z" class="il-g" fill="#8d9298" stroke-width="1.5"/>
      ${[38, 46, 54, 62].map((y) => `<line x1="18" y1="${y}" x2="62" y2="${y + 4}" stroke="#5d6268" stroke-width="2"/>`).join('')}
      <path d="M26 72 h28 l-5 20 h-18 z" fill="${c}" class="il-g" stroke-width="1"/>
      <rect x="37" y="92" width="6" height="8" fill="#9aa0a6"/>
      <path d="M58 72 v32 h-15" fill="none" stroke="#9aa0a6" stroke-width="5" stroke-linejoin="round"/>
      ${extra || ''}
      <text x="40" y="124" text-anchor="middle" font-size="11" font-weight="800" class="il-v">${nome}</text>
      <text x="40" y="140" text-anchor="middle" font-size="11" class="${cls}">${diz[0]}</text>
      <text x="40" y="154" text-anchor="middle" font-size="11" class="${cls}">${diz[1] || ''}</text></g>`;
    return `<svg viewBox="0 0 330 160" role="img" aria-label="Cores das velas">
      ${v(0, '#C9A06A', 'Marrom-clara', ['normal', ''], 'il-ok')}
      ${v(82, '#2b2b2b', 'Preta seca', ['mistura rica', 'ou ar sujo'], 'il-bad')}
      ${v(164, '#3a2c18', 'Molhada', ['óleo ou', 'sem faísca'], 'il-bad', '<ellipse cx="34" cy="80" rx="3" ry="5" fill="#fff" opacity=".35"/>')}
      ${v(246, '#ECEBE6', 'Branca', ['pobre ou', 'superaquecida'], 'il-bad', '<circle cx="36" cy="84" r="1.6" fill="#999"/><circle cx="44" cy="79" r="1.3" fill="#999"/>')}
    </svg>`; })(),
    leg: 'Compare todas as velas: a diferente mostra o cilindro com problema. Preta seca = rica; molhada de óleo = anéis ou retentores; molhada de combustível = sem faísca; branca com bolhinhas = pobre ou ponto adiantado. Confira também a folga do eletrodo.' };
  // Vazão: proveta com o volume em 30 s
  L.fflow = { svg: (() => {
    const X = 40, W = 70, Y0 = 18, Y1 = 142, y = (ml) => Y1 - ml / 1000 * (Y1 - Y0), nivel = 600;
    let s = `<rect x="${X}" y="${y(nivel).toFixed(1)}" width="${W}" height="${(Y1 - y(nivel)).toFixed(1)}" fill="#C98200" opacity=".55"/>`;
    s += `<path d="M${X} ${Y0 - 6} v${Y1 - Y0 + 6} h${W} v-${Y1 - Y0 + 6}" fill="none" class="il-n" stroke-width="2.5"/><path d="M${X - 10} ${Y1 + 2} h${W + 20}" class="il-n" stroke-width="4"/>`;
    for (let m = 0; m <= 1000; m += 100) { const yy = y(m).toFixed(1), g = m % 500 == 0; s += `<line x1="${X}" y1="${yy}" x2="${X + (g ? 18 : 10)}" y2="${yy}" class="il-g" stroke-width="1.5"/>`; if (g && m) s += `<text x="${X - 6}" y="${(+yy + 4)}" text-anchor="end" font-size="10.5" class="il-t">${m}</text>`; }
    s += `<line x1="${X}" y1="${y(500).toFixed(1)}" x2="${X + W}" y2="${y(500).toFixed(1)}" stroke="#2E8B57" stroke-width="2" stroke-dasharray="5 3"/>`;
    s += `<text x="${X + W / 2}" y="${(y(nivel) - 6).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="800" class="il-v">600 ml</text><text x="${X + W / 2}" y="${Y1 + 16}" text-anchor="middle" font-size="10.5" class="il-t">ml em 30 s</text>`;
    const lado = [['Referência comum:', 'il-t'], ['acima de ~1 L/min', 'il-ok'], ['15 s: ≥ 250 ml', 'il-ok'], ['30 s: ≥ 500 ml', 'il-ok'], ['Abaixo: bomba fraca,', 'il-bad'], ['filtro, pescador', 'il-bad'], ['ou tensão baixa', 'il-bad']];
    s += lado.map((l, i) => `<text x="140" y="${28 + i * 20}" font-size="13" class="${l[1]}">${l[0]}</text>`).join('');
    return `<svg viewBox="0 0 320 166" role="img" aria-label="Vazão da bomba numa proveta">${s}</svg>`; })(),
    leg: 'Acione a bomba por 15 ou 30 s com a saída numa proveta. Meça a tensão na bomba ao mesmo tempo: abaixo de 12 V a vazão cai. O valor certo do carro está no manual.' };

  /* ---------- 2.43.0: testes de injeção ---------- */
  // barras lado a lado (uma por bico/cilindro); ruins em vermelho com o motivo embaixo
  function barras(o) {
    const X0 = 40, X1 = 312, Y0 = 16, Y1 = 118, n = o.v.length, bw = Math.min(46, (X1 - X0) / n * .58), y = (v) => Y1 - v / o.max * (Y1 - Y0);
    let s = `<rect x="${X0}" y="${Y0}" width="${X1 - X0}" height="${Y1 - Y0}" rx="4" class="il-bg"/>`;
    (o.ylin || []).forEach((v) => { s += `<line x1="${X0}" y1="${y(v).toFixed(1)}" x2="${X1}" y2="${y(v).toFixed(1)}" class="il-g" stroke-width="1"/><text x="${X0 - 4}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" class="il-t" font-size="10.5">${o.yfmt ? o.yfmt(v) : f(v)}</text>`; });
    if (o.faixa) s += `<rect x="${X0}" y="${y(o.faixa[1]).toFixed(1)}" width="${X1 - X0}" height="${(y(o.faixa[0]) - y(o.faixa[1])).toFixed(1)}" class="il-zb"/>`;
    o.v.forEach((v, i) => { const cx = X0 + (X1 - X0) * (i + .5) / n, b = (o.ruim || {})[i];
      s += `<rect x="${(cx - bw / 2).toFixed(1)}" y="${y(v).toFixed(1)}" width="${bw.toFixed(1)}" height="${(Y1 - y(v)).toFixed(1)}" rx="3" class="${b ? 'il-z-rf' : 'il-z-gf'}"/>`;
      s += `<text x="${cx.toFixed(1)}" y="${(y(v) - 5).toFixed(1)}" text-anchor="middle" font-size="11.5" font-weight="700" class="il-v">${o.fmt ? o.fmt(v) : f(v)}</text>`;
      s += `<text x="${cx.toFixed(1)}" y="${Y1 + 15}" text-anchor="middle" font-size="11" class="il-t">${o.lbl[i]}</text>`;
      if (b) s += `<text x="${cx.toFixed(1)}" y="${Y1 + 30}" text-anchor="middle" font-size="11" class="il-bad">${b}</text>`; });
    return `<svg viewBox="0 0 320 ${Y1 + 36}" role="img" aria-label="${o.aria}">${s}</svg>`;
  }
  L.injbal = { svg: barras({ aria: 'Queda de pressão por bico', v: [0.62, 0.6, 0.38, 0.85], max: 1, ylin: [0, 0.5, 1], yfmt: (v) => f(v) + ' bar', lbl: ['bico 1', 'bico 2', 'bico 3', 'bico 4'], ruim: { 2: 'entupido', 3: 'vazando' }, faixa: [0.56, 0.68], fmt: (v) => v.toFixed(2).replace('.', ',') }),
    leg: 'Cada bico acionado pelo mesmo tempo. A queda de pressão tem que ser parecida (diferença até ~10%). Caiu menos = entupido; caiu mais = vazando ou abrindo demais.' };
  L.pwrbal = { svg: barras({ aria: 'Queda de rotação ao cortar cada cilindro', v: [120, 115, 35, 125], max: 150, ylin: [0, 50, 100, 150], yfmt: (v) => v + '', lbl: ['cil. 1', 'cil. 2', 'cil. 3', 'cil. 4'], ruim: { 2: 'fraco' }, fmt: (v) => '−' + v }),
    leg: 'Quanto a rotação caiu (rpm) ao cortar cada cilindro. Todos parecidos = ok. O que quase não derruba é o cilindro fraco: veja compressão, faísca e bico dele.' };
  L.injbench = { svg: barras({ aria: 'Vazão dos bicos na bancada', v: [62, 61, 48, 62], max: 80, ylin: [0, 40, 80], yfmt: (v) => v + ' ml', lbl: ['bico 1', 'bico 2', 'bico 3', 'bico 4'], ruim: { 2: 'vazão baixa' }, faixa: [59, 65], fmt: (v) => v + ' ml' }),
    leg: 'Mesmo tempo para todos: vazão igual (diferença até ~5%), leque cônico e pulverizado, sem pingar em 1 minuto com pressão. Fora disso: limpar e testar de novo.' };
  L.injcur = { svg: tela({ aria: 'Corrente do bico com o dente da agulha', ymin: 0, ymax: 1.4, ylin: [0, 0.5, 1], yfmt: (v) => f(v) + ' A', xleg: 'tempo do pulso (≈ 3 ms na lenta)',
    ondas: [{ p: (() => { const a = [[0, 0], [.12, 0]]; for (let i = 0; i <= 60; i++) { const t = i / 60, tt = .12 + t * .6; let v = 1.05 * (1 - Math.exp(-t * 4)); if (t > .42 && t < .52) v -= .07 * Math.sin((t - .42) / .1 * Math.PI); a.push([tt, v]); } a.push([.72, 0], [1, 0]); return a; })() },
      { p: (() => { const a = []; for (let i = 0; i <= 30; i++) { const t = i / 30; a.push([.12 + t * .6, 1.05 * (1 - Math.exp(-t * 4))]); } return a; })(), cls: 'il-bad', sw: 1.6 }],
    notas: [[.5, .45, '“dente”: agulha abriu'], [.42, 1.27, 'tracejada sem dente = agulha presa', 'middle', 'il-bad']] }),
    leg: 'A corrente sobe em rampa até ≈ 1 A (bico de alta impedância). O pequeno “dente” no meio é a agulha abrindo. Sem o dente = agulha presa. Corrente alta demais = bobina do bico em curto.' };
  L.o2resp = { svg: tela({ aria: 'Resposta da sonda lambda', ymin: 0, ymax: 1, ylin: [0.2, 0.45, 0.8], yfmt: (v) => f(v) + ' V', xleg: 'acelera rápido → puxa mangueira de vácuo',
    faixas: [[0.8, 1], [0, 0.2]],
    ondas: [{ p: [...pts(40, (t) => 0.45 + 0.35 * Math.sin(t * 28)).map(([t, v]) => [t * .25, v]), [.28, .92], [.5, .93], [.53, .08], [.78, .07], [.82, .5], [1, .5]] },
      { p: [[.5, .93], [.7, .35], [.78, .1]], cls: 'il-bad', sw: 1.6 }],
    notas: [[.38, .97, 'rica > 0,8 V'], [.66, .13, 'pobre < 0,2 V'], [.8, .75, 'descida lenta = gasta', 'middle', 'il-bad']] }),
    leg: 'Acelerando rápido a sonda vai acima de 0,8 V; puxando uma mangueira de vácuo cai abaixo de 0,2 V. A descida tem que ser quase vertical (menos de ~100–300 ms). Descida lenta = sonda gasta ou contaminada.' };
  L.o2heat = { svg: visor({ aria: 'Multímetro medindo o aquecedor da sonda', lcd: '6,0 Ω', modo: 'Ω · aquecedor da sonda', lado: [['Em geral 2–15 Ω', 'il-ok'], ['(veja o manual)'], ['OL / aberto = queimado', 'il-bad'], ['12 V no chicote', 'il-ok']] }),
    leg: 'Medir com o conector solto, nos 2 fios do aquecedor (em geral da mesma cor). Aberto (OL) = aquecedor queimado. Com a ignição ligada, o chicote tem que ter 12 V.' };
  L.wbo2 = { svg: escala({ aria: 'Lambda da sonda banda larga', min: 0.8, max: 1.3, marcas: [0.8, 0.9, 1, 1.1, 1.2, 1.3], fmt: (v) => f(v), zonas: [[0.98, 1.02, 'g'], [0.8, 0.98, 'a'], [1.02, 1.3, 'a']],
    pinos: [[0.88, 'acelerando (rica)'], [1, 'lenta ≈ 1,00'], [1.22, 'soltando (pobre)']] }),
    leg: 'No scanner, com motor quente: marcha lenta ≈ lambda 1,00 (0,98–1,02). Acelerando forte fica abaixo de 1; soltando o acelerador (corte de combustível) vai bem acima de 1.' };
  L.evap = { svg: (() => {
    const v = (x, tt, ab, ok, sub) => `<g transform="translate(${x} 0)"><rect x="4" y="6" width="148" height="128" rx="10" class="il-bg"/>
      <text x="78" y="26" text-anchor="middle" font-size="12.5" font-weight="800" class="il-v">${tt}</text>
      <path d="M18 70 h36 M102 70 h36" class="il-n" stroke-width="6" stroke-linecap="round"/>
      <rect x="54" y="50" width="48" height="40" rx="6" fill="none" class="il-n" stroke-width="2.5"/>
      ${ab ? '<path d="M40 70 h76" class="il-s" stroke-width="3" stroke-dasharray="6 4"/><path d="M110 64 l8 6 l-8 6" fill="none" class="il-s" stroke-width="3"/>' : '<path d="M78 52 v36" class="il-n" stroke-width="5"/><path d="M40 70 h10" class="il-s" stroke-width="3"/>'}
      <text x="78" y="112" text-anchor="middle" font-size="12" class="${ok}">${sub[0]}</text><text x="78" y="127" text-anchor="middle" font-size="11" class="il-t">${sub[1]}</text></g>`;
    return `<svg viewBox="0 0 320 140" role="img" aria-label="Válvula do canister fechada e aberta">${v(0, 'Desligada', 0, 'il-ok', ['fechada ✓', 'segura o vácuo'])}${v(160, 'Acionada (12 V)', 1, 'il-ok', ['abre ✓', 'clique e passa ar'])}</svg>`; })(),
    leg: 'Desligada, a válvula não pode deixar passar vácuo. Acionada, tem que abrir. Se passa vácuo desligada (travada aberta) = mistura rica e lenta ruim depois de abastecer.' };
  L.iatect = { svg: escala({ aria: 'Temperatura do ar e do motor com o motor frio', min: 0, max: 50, marcas: [0, 10, 20, 30, 40, 50], fmt: (v) => v + ' °C', zonas: [[19, 29, 'g']],
    pinos: [[22, 'ar (IAT) 22 °C'], [25, 'motor (ECT) 25 °C']] }),
    leg: 'Motor frio depois de horas parado: as duas temperaturas ficam perto da do ambiente, com diferença de até 3–5 °C. Diferença maior = sensor com defeito ou fiação com mau contato.' };
  L.advload = { svg: escala({ aria: 'Avanço de ignição na marcha lenta', min: -5, max: 35, marcas: [-5, 0, 5, 10, 20, 35], fmt: (v) => v + '°', zonas: [[5, 20, 'g'], [-5, 5, 'a'], [20, 35, 'a']], pinos: [[12, 'avanço na lenta 5–20°']] }) +
    escala({ aria: 'Carga calculada na marcha lenta', min: 0, max: 100, marcas: [0, 15, 35, 60, 100], fmt: (v) => v + '%', zonas: [[15, 35, 'g'], [35, 100, 'a']], pinos: [[25, 'carga na lenta 15–35%']] }),
    leg: 'Motor quente em marcha lenta, sem ar ligado. Avanço estável na faixa do carro e carga baixa. Avanço baixo ou pulando = detonação ou sinal de rotação ruim. Carga alta = entrada de ar, motor fraco ou ponto atrasado.' };
  L.iacpos = { svg: escala({ aria: 'Posição da marcha lenta', min: 0, max: 100, marcas: [0, 20, 40, 60, 80, 100], fmt: (v) => v + '%', zonas: [[0, 15, 'r'], [15, 45, 'g'], [45, 100, 'a']],
    pinos: [[8, 'baixo: ar falso'], [30, 'normal'], [75, 'alto: borboleta suja']] }),
    leg: 'Exemplo em % de abertura (no motor de passo, em passos). Dentro da faixa do carro e estável; sobe um pouco com o ar ligado. Muito alto = borboleta suja ou passagem restrita. Muito baixo = entrada falsa de ar.' };
  L.flexad = { svg: escala({ aria: 'Percentual de etanol aprendido', min: 0, max: 112, marcas: [0, 30, 50, 75, 100], fmt: (v) => v + '%', zonas: [[25, 35, 'g'], [92, 100, 'g']],
    pinos: [[30, 'gasolina comum ≈ 30%'], [100, 'etanol 100%']] }),
    leg: 'O % de etanol que a injeção aprendeu tem que combinar com o tanque. Diferente: rodar para reaprender (ou resetar pelo scanner) e conferir sonda lambda e qualidade do combustível.' };
  L.ecugnd = { svg: visor({ aria: 'Queda de tensão na massa da ECU', lcd: '0,04 V', modo: 'V · massa da ECU → bateria (−)', lado: [['Massas: até 0,1 V', 'il-ok'], ['Acima = massa ruim', 'il-bad'], ['Alimentação: 12 V', 'il-ok'], ['Partida: ≥ 9,6 V', 'il-ok']] }),
    leg: 'Ponta preta no negativo da bateria e vermelha na massa da ECU, motor ligado com faróis e ventoinha. Massa ruim causa falhas “fantasmas” em vários sensores ao mesmo tempo.' };
  L.gdirail = { svg: tela({ aria: 'Pressão do rail desejada e real', ymin: 0, ymax: 220, ylin: [50, 100, 200], yfmt: (v) => v + ' bar', x0: 46, xleg: 'lenta → 3.000 rpm → acelerada forte',
    ondas: [{ p: [[0, 50], [.3, 50], [.36, 100], [.6, 100], [.66, 190], [.9, 190], [1, 190]], cls: 'il-s2', sw: 2 }, { p: [[0, 48], [.3, 48], [.37, 97], [.6, 98], [.68, 186], [.9, 187], [1, 187]] },
      { p: [[.6, 98], [.7, 130], [.9, 128], [1, 127]], cls: 'il-bad', sw: 1.6 }],
    notas: [[.04, 70, 'desejada', 'start', 'il-v il-b2'], [.04, 30, 'real', 'start', 'il-v il-b1'], [.45, 152, 'tracejada: real abaixo = bomba de alta', 'middle', 'il-bad']] }),
    leg: 'A real (amarela) acompanha a desejada (azul) em todas as rotações. Real abaixo = bomba de alta (ou o came dela), válvula reguladora ou bomba de baixa fraca. Real alta e parada = sensor do rail ou válvula reguladora.' };

  G.DGILU = L;

  const st = document.createElement('style');
  st.textContent = `.dg-ilu{margin:8px 0 4px;padding:10px;border-radius:12px;background:var(--sf);border:1px solid var(--ln);max-width:420px}.dg-ilu svg{display:block;width:100%;height:auto}.dg-ilu p{margin:6px 0 0!important;font-size:13px;color:var(--mut);line-height:1.4}
.il-g{stroke:var(--ln)}.il-bg{fill:color-mix(in srgb,var(--ink) 4%,transparent);stroke:var(--ln)}.il-t{fill:var(--mut)}.il-v{fill:var(--ink)}.il-s{stroke:var(--hi)}.il-s2{stroke:#5fa8e0}.il-b2{fill:#5fa8e0}.il-b1{fill:var(--hi)}.il-n{stroke:var(--ink)}.il-nf{fill:var(--ink)}
.il-ok{fill:#3fb06f;font-weight:700}.il-bad{fill:#E07A5F;stroke:#E07A5F}text.il-bad{stroke:none;font-weight:700}polyline.il-bad{fill:none!important;stroke-dasharray:5 4}
.il-z-g{stroke:#2E8B57}.il-z-a{stroke:#C98200}.il-z-r{stroke:#B4472E}.il-z-gf{fill:#2E8B57}.il-z-af{fill:#C98200;opacity:.75}.il-z-rf{fill:#B4472E}.il-zb{fill:#2E8B57;opacity:.18}
.il-lcd{fill:#B9C7A3}.il-lcdt{fill:#1b2414}`;
  document.head.appendChild(st);
})(window);
