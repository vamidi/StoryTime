using UnityEngine;
using UnityEngine.Events;

namespace DatabaseSync.Events
{
	[CreateAssetMenu(menuName = "DatabaseSync/Events/Characters/Enemy Damage Receiver", order = 51)]
	public class DamageReceiverChannelSO : ScriptableObject
	{
		UnityAction<Components.MessageType, Components.Damageable.DamageMessage> OnEventRaised;

		public void RaiseEvent(Components.MessageType type, Components.Damageable.DamageMessage dmgMessage) => OnEventRaised?.Invoke(type, dmgMessage);
	}
}
