using UnityEngine;
using UnityEngine.Events;

namespace DatabaseSync.Events
{
	public class GameObjectDestroyedChannel : EventChannelBaseSO
	{
		public UnityAction<GameObject> OnEventRaised;

		public void RaiseEvent(GameObject other)
		{
			if (OnEventRaised != null)
				OnEventRaised.Invoke(other);
		}
	}
}
