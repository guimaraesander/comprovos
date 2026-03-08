import { useState } from "react";

export function PageTemplate() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  function openModal() {
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  return (
    <section>
      {/* Header padrão */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Título da Página</h2>
          <p className="page-subtitle">Descrição curta do que essa página faz.</p>
        </div>

        <div className="page-actions">
          <button type="button" className="btn btn-secondary">
            Atualizar
          </button>

          <button type="button" className="btn btn-primary" onClick={openModal}>
            Novo
          </button>
        </div>
      </div>

      {/* Alert padrão (usar só quando existir erro) */}
      {/* <div className="alert-error" role="alert">Mensagem de erro</div> */}

      {/* Card + tabela padrão */}
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Coluna 1</th>
                <th>Coluna 2</th>
                <th>Coluna 3</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="muted" colSpan={3}>
                  Nenhum registro ainda.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal padrão */}
      {isModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Novo Registro</h3>
                <p>Preencha os dados e clique em “Salvar”.</p>
              </div>

              <button type="button" className="icon-btn" onClick={closeModal} aria-label="Fechar">
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <label className="field">
                  Campo 1
                  <input placeholder="Ex.: valor" />
                </label>

                <label className="field">
                  Campo 2
                  <input placeholder="Ex.: valor" />
                </label>

                <label className="field field-full">
                  Campo grande
                  <textarea rows={3} placeholder="Ex.: descrição" />
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cancelar
              </button>

              <button type="button" className="btn btn-primary">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}