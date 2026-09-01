function DeleteConfirm({ label, onCancel, onConfirm }) {
  return <div className="modal-backdrop"><section className="delete-confirm" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><span className="delete-warning">!</span><h2 id="delete-title">Delete {label}?</h2><p>This action cannot be undone. The selected item and its evidence will be removed.</p><div><button className="delete-cancel" type="button" onClick={onCancel}>Cancel</button><button className="delete-danger" type="button" onClick={onConfirm}>Delete permanently</button></div></section></div>
}

export default DeleteConfirm
