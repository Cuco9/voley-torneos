// =====================
// NORMAS DE CLASIFICACIÓN
// =====================

const NORMAS_SALA = [
  {
    id: 'sala_fivb_puntos',
    titulo: 'Sistema de puntos FIVB (Oficial)',
    badge: 'oficial',
    descripcion: 'Victoria 3-0 o 3-1: 3 pts ganador / 0 pts perdedor. Victoria 3-2: 2 pts ganador / 1 pt perdedor. Derrota 0-3 o 1-3: 0 pts. Derrota 2-3: 1 pt.',
    calcularPuntos: function(resultado) {
      // resultado: {setsG, setsP} desde la perspectiva del ganador
      if (resultado.setsG === 3 && (resultado.setsP === 0 || resultado.setsP === 1)) return { ganador: 3, perdedor: 0 };
      if (resultado.setsG === 3 && resultado.setsP === 2) return { ganador: 2, perdedor: 1 };
      return { ganador: 0, perdedor: 0 };
    }
  },
  {
    id: 'sala_clasica',
    titulo: 'Sistema clásico (2 pts por victoria)',
    badge: 'alternativa',
    descripcion: 'Cada victoria vale 2 puntos. La derrota vale 0. Simple y directo para torneos locales.',
    calcularPuntos: function(resultado) {
      return { ganador: 2, perdedor: 0 };
    }
  },
  {
    id: 'sala_desempate_sets',
    titulo: 'Desempate por diferencia de sets',
    badge: 'alternativa',
    descripcion: 'En caso de empate en puntos, se desempata por: 1. Mayor diferencia de sets (SF-SC). 2. Mayor diferencia de puntos (PF-PC). 3. Mayor cantidad de puntos a favor.',
    calcularPuntos: null // Solo afecta el desempate, no los puntos
  },
  {
    id: 'sala_desempate_puntos',
    titulo: 'Desempate por cociente de puntos',
    badge: 'alternativa',
    descripcion: 'En caso de empate, el desempate se hace por cociente: (PF/PC). A mayor cociente, mejor clasificado.',
    calcularPuntos: null
  },
  {
    id: 'sala_setsganados',
    titulo: 'Clasificación por sets ganados (sin puntos)',
    badge: 'alternativa',
    descripcion: 'La tabla se ordena directamente por número de sets ganados. Sin sistema de puntos. Útil para torneos cortos.',
    calcularPuntos: function(resultado) {
      return { ganador: 0, perdedor: 0 };
    }
  }
];

const NORMAS_PLAYA = [
  {
    id: 'playa_fivb_puntos',
    titulo: 'Sistema de puntos FIVB Playa (Oficial)',
    badge: 'oficial',
    descripcion: 'Victoria 2-0: 3 pts ganador / 0 pts perdedor. Victoria 2-1: 2 pts ganador / 1 pt perdedor. Aplica en torneos de liga de playa.',
    calcularPuntos: function(resultado) {
      if (resultado.setsG === 2 && resultado.setsP === 0) return { ganador: 3, perdedor: 0 };
      if (resultado.setsG === 2 && resultado.setsP === 1) return { ganador: 2, perdedor: 1 };
      return { ganador: 0, perdedor: 0 };
    }
  },
  {
    id: 'playa_clasica',
    titulo: 'Sistema clásico playa (2 pts victoria)',
    badge: 'alternativa',
    descripcion: '2 puntos por victoria, 0 por derrota. Sin distinción según sets. Ideal para torneos locales informales.',
    calcularPuntos: function(resultado) {
      return { ganador: 2, perdedor: 0 };
    }
  },
  {
    id: 'playa_desempate_sets',
    titulo: 'Desempate por diferencia de sets',
    badge: 'alternativa',
    descripcion: 'En caso de empate: 1. Sets ganados - perdidos. 2. Puntos a favor - en contra. 3. Mayor cantidad de puntos a favor.',
    calcularPuntos: null
  },
  {
    id: 'playa_head2head',
    titulo: 'Desempate head-to-head',
    badge: 'alternativa',
    descripcion: 'En caso de empate entre dos equipos, el resultado directo entre ellos decide. Si son 3+ equipos empatados, se usa diferencia de sets del mini-torneo entre ellos.',
    calcularPuntos: null
  }
];

// =====================
// REGLAMENTO RESUMIDO
// =====================

const REGLAMENTO = {
  sala: {
    sets: 5,
    puntosSet: 25,
    puntosFinalSet: 15,
    minDiferencia: 2,
    jugadoresPorEquipo: 6,
    sustituciones: 6,
    tiemposMuertos: 2
  },
  playa: {
    sets: 3,
    puntosSet: 21,
    puntosFinalSet: 15,
    minDiferencia: 2,
    jugadoresPorEquipo: 2,
    sustituciones: 0,
    tiemposMuertos: 1
  }
};
