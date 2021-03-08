using UnityEngine;
using UnityEngine.Animations.Rigging;

namespace DatabaseSync.Components
{
	public class CharacterHeadAim : MonoBehaviour
	{
		public Transform aimController;
		public Transform aimTarget;
		public MultiAimConstraint multiAim;

		void Update()
		{
			float weight = (aimTarget == null) ? 0 : 1f;
			Transform tr = transform;
			Vector3 pos = (aimTarget == null) ? tr.position + tr.forward + Vector3.up : aimTarget.position + Vector3.up;

			multiAim.weight = Mathf.Lerp(multiAim.weight, weight, .05f);
			aimController.position = Vector3.Lerp(aimController.position, pos, .3f);
		}

		private void OnTriggerEnter(Collider other)
		{
			if (other.CompareTag("Player"))
				aimTarget = other.transform;
		}

		private void OnTriggerExit(Collider other)
		{
			if (other.CompareTag("Player"))
				aimTarget = null;
		}
	}
}
