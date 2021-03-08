using UnityEngine;

namespace DatabaseSync.Components.Characters
{
    public class DefaultPlayerBehaviour : MonoBehaviour
    {
	    public bool IsInteracting { get => Interacting; set => Interacting = value; }

	    [SerializeField]
        private LayerMask layerMask;

        protected bool Interacting;

        private void OnEnable()
        {
	        // inputReader.interactEvent += Confirm;
        }

        private void OnDisable()
        {
	        // inputReader.interactEvent -= Confirm;
        }
    }
}
