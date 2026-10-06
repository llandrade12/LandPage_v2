/* Fôlego Cred — LP de captura
   Valida o formulário e redireciona o lead para o WhatsApp com a mensagem pronta. */

(function () {
  'use strict';

  // Número que recebe os leads: código do país (55) + DDD + número, só dígitos.
  var WHATSAPP_DESTINO = '5571996240957';

  // Requisitos para pedir crédito: 3 meses de aplicativo e ganho a partir de R$ 3.000.
  var GANHOS = {
    menos3k: { texto: 'Menos de R$ 3.000', atende: false },
    '3a4k': { texto: 'De R$ 3.000 a R$ 4.000', atende: true },
    '4a5k': { texto: 'De R$ 4.000 a R$ 5.000', atende: true },
    '5a7k': { texto: 'De R$ 5.000 a R$ 7.000', atende: true },
    mais7k: { texto: 'Mais de R$ 7.000', atende: true }
  };

  // Texto de cada faixa de tempo (só a primeira, "menos3", não atende o mínimo de 3 meses).
  var TEMPOS = {
    menos3: { texto: 'Menos de 3 meses', atende: false },
    '3a6': { texto: 'De 3 a 6 meses', atende: true },
    '6a12': { texto: 'De 6 meses a 1 ano', atende: true },
    '1a2': { texto: 'De 1 a 2 anos', atende: true },
    mais2: { texto: 'Mais de 2 anos', atende: true }
  };

  var form = document.getElementById('formulario');
  var campoNome = document.getElementById('fc-nome');
  var campoFone = document.getElementById('fc-fone');
  var campoTempo = document.getElementById('fc-tempo');
  var campoGanho = document.getElementById('fc-ganho');
  var caixaErro = document.getElementById('fc-erro');

  function soDigitos(valor) {
    return String(valor).replace(/\D/g, '');
  }

  function mascaraFone(valor) {
    var d = soDigitos(valor).slice(0, 11);
    if (d.length <= 2) return d.length ? '(' + d : '';
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  campoFone.addEventListener('input', function () {
    campoFone.value = mascaraFone(campoFone.value);
    if (soDigitos(campoFone.value).length === 11) atualizarProgresso();
  });

  function lerRespostas() {
    var marcado = form.querySelector('input[name="carro"]:checked');
    return {
      nome: campoNome.value.trim(),
      fone: campoFone.value.trim(),
      carro: marcado ? marcado.value : '',
      tempo: campoTempo.value,
      ganho: campoGanho.value
    };
  }

  function oQueFalta(r) {
    var faltando = [];
    if (r.nome.length < 2) faltando.push('seu nome');
    if (soDigitos(r.fone).length < 10) faltando.push('seu WhatsApp com DDD');
    if (!r.carro) faltando.push('se o carro é próprio ou alugado');
    if (!r.tempo) faltando.push('seu tempo de aplicativo');
    if (!r.ganho) faltando.push('seu ganho mensal');
    return faltando;
  }

  // Devolve a lista de requisitos que a pessoa não atende (vazia = pode seguir).
  function requisitosNaoAtendidos(r) {
    var motivos = [];
    if (TEMPOS[r.tempo] && !TEMPOS[r.tempo].atende) motivos.push('no mínimo 3 meses de aplicativo');
    if (GANHOS[r.ganho] && !GANHOS[r.ganho].atende) motivos.push('ganho mensal a partir de R$ 3.000');
    return motivos;
  }

  function montarLink(r) {
    var mensagem = [
      'Olá! Vim pelo site e quero pedir crédito na Fôlego Cred.',
      '',
      'Nome: ' + r.nome,
      'WhatsApp: ' + r.fone,
      'Carro: ' + r.carro,
      'Tempo de aplicativo: ' + (TEMPOS[r.tempo] ? TEMPOS[r.tempo].texto : r.tempo),
      'Ganho mensal: ' + (GANHOS[r.ganho] ? GANHOS[r.ganho].texto : r.ganho)
    ].join('\n');
    return 'https://wa.me/' + WHATSAPP_DESTINO + '?text=' + encodeURIComponent(mensagem);
  }

  // ---------- Microinterações: progresso, "visto" nos campos e reação do leão ----------

  var barra = document.getElementById('fc-barra');
  var passos = document.getElementById('fc-passos');
  var leao = document.getElementById('fc-leao');
  var feitosAntes = 0;

  function reiniciarAnimacao(el, classe) {
    if (!el) return;
    el.classList.remove(classe);
    void el.offsetWidth;
    el.classList.add(classe);
  }

  function atualizarProgresso() {
    var r = lerRespostas();
    var ok = {
      nome: r.nome.length >= 2,
      fone: soDigitos(r.fone).length >= 10,
      carro: !!r.carro,
      tempo: !!r.tempo,
      ganho: !!r.ganho
    };
    var feitos = 0;

    Object.keys(ok).forEach(function (chave) {
      var bloco = form.querySelector('[data-campo="' + chave + '"]');
      if (bloco) bloco.classList.toggle('ok', ok[chave]);
      if (ok[chave]) feitos += 1;
    });

    if (barra) barra.style.transform = 'scaleX(' + feitos / 5 + ')';
    if (passos) passos.textContent = feitos + ' de 5';

    if (feitos > feitosAntes) reiniciarAnimacao(leao, 'anotou');
    feitosAntes = feitos;
  }

  form.addEventListener('change', atualizarProgresso);

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();

    var respostas = lerRespostas();
    var faltando = oQueFalta(respostas);

    if (faltando.length) {
      caixaErro.textContent = 'Falta informar ' + faltando.join(', ') + '.';
      caixaErro.hidden = false;
      reiniciarAnimacao(caixaErro, 'tremer');
      caixaErro.scrollIntoView({ block: 'nearest' });
      return;
    }

    var motivos = requisitosNaoAtendidos(respostas);

    if (motivos.length) {
      caixaErro.textContent = 'No momento, o crédito é para quem tem ' + motivos.join(' e ') + '. Quando você atingir esses requisitos, será um prazer atender você!';
      caixaErro.hidden = false;
      reiniciarAnimacao(caixaErro, 'tremer');
      caixaErro.scrollIntoView({ block: 'nearest' });
      return;
    }

    caixaErro.hidden = true;

    // Ponto para disparar a conversão do Pixel da Meta, quando ele estiver instalado:
    // if (window.fbq) fbq('track', 'Lead');

    window.location.href = montarLink(respostas);
  });
})();
