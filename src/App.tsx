import { useEffect } from 'react';
import { perguntasPlanas } from './data';
import { useConfessionState } from './hooks/useConfessionState';
import { PrivacyBlur } from './components/PrivacyBlur';
import { StartScreen } from './components/StartScreen';
import { QuestionWizard } from './components/QuestionWizard';
import { SummaryScreen } from './components/SummaryScreen';

export default function App() {
  const {
    estado,
    temProgresso,
    iniciar,
    responder,
    anotar,
    confirmarEAvancar,
    responderTexto,
    pularGrupo,
    voltar,
    irParaResumo,
    revisar,
    apagarTudo,
  } = useConfessionState();

  // Sempre começa cada tela e cada pergunta do topo (o campo de anotação pode ter rolado a página).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [estado.tela, estado.indice]);

  return (
    <PrivacyBlur>
      {estado.tela === 'preparacao' && <StartScreen temProgresso={temProgresso} onIniciar={iniciar} />}

      {estado.tela === 'exame' && (
        <QuestionWizard
          estado={estado}
          item={perguntasPlanas[estado.indice]}
          onResponder={responder}
          onAnotar={anotar}
          onConfirmar={confirmarEAvancar}
          onResponderTexto={responderTexto}
          onVoltar={voltar}
          onPularGrupo={pularGrupo}
          onTerminar={irParaResumo}
        />
      )}

      {estado.tela === 'confessionario' && (
        <SummaryScreen estado={estado} onRevisar={revisar} onApagar={apagarTudo} />
      )}
    </PrivacyBlur>
  );
}
