using UnityEngine;
using UnityEngine.Events;

namespace DatabaseSync.Components
{
	public enum MessageType
	{
		Damaged,
		Dead,
		Respawn,
		// Add your user defined message type after
	}

    public partial class Damageable : MonoBehaviour
    {

	    [Tooltip("When this gameObject is damaged, these other gameObjects are notified.")]
	    [SerializeField] private Events.DamageReceiverChannelSO onDamageMessageReceivers;

		//
        public int maxHitPoints;

        [Tooltip("Time that this gameObject is invulnerable for, after receiving damage.")]
        public float invulnerabiltyTime;

        [Tooltip("The angle from the which that damageable is able to hit. Always in the world XZ plane, with the forward being rotate by hitForwardRotation")]
        [Range(0.0f, 360.0f)]
        public float hitAngle = 360.0f;

        [Tooltip("Allow to rotate the world forward vector of the damageable used to define the hitAngle zone")]
        [Range(0.0f, 360.0f)]
        public float hitForwardRotation = 360.0f;

        public bool IsInvulnerable { get; set; }
        public int CurrentHitPoints { get; private set; }

        public UnityEvent onDeath, onReceiveDamage, onHitWhileInvulnerable, onBecomeVulnerable, onResetDamage;

        protected float m_TimeSinceLastHit;
        protected Collider m_Collider;

        System.Action m_Schedule;

        void Start()
        {
            ResetDamage();
            m_Collider = GetComponent<Collider>();
        }

        void Update()
        {
            if (IsInvulnerable)
            {
	            m_TimeSinceLastHit += Time.deltaTime;
                if (m_TimeSinceLastHit > invulnerabiltyTime)
                {
	                m_TimeSinceLastHit = 0.0f;
                    IsInvulnerable = false;
                    onBecomeVulnerable.Invoke();
                }
            }
        }

        public void ResetDamage()
        {
            CurrentHitPoints = maxHitPoints;
            IsInvulnerable = false;
            m_TimeSinceLastHit = 0.0f;
            onResetDamage.Invoke();
        }

        public void SetColliderState(bool enabled)
        {
            m_Collider.enabled = enabled;
        }

        public void ApplyDamage(DamageMessage data)
        {
            if (CurrentHitPoints <= 0)
            {
	            // ignore damage if already dead. TODO : may have to change that if we want to detect hit on death...
                return;
            }

            if (IsInvulnerable)
            {
                onHitWhileInvulnerable.Invoke();
                return;
            }

            Transform t = transform;
            Vector3 forward = t.forward;
            Vector3 up = t.up;

            forward = Quaternion.AngleAxis(hitForwardRotation, up) * forward;

            //we project the direction to damager to the plane formed by the direction of damage
            Vector3 positionToDamager = data.damageSource - t.position;
            positionToDamager -= up * Vector3.Dot(up, positionToDamager);

            if (Vector3.Angle(forward, positionToDamager) > hitAngle * 0.5f)
                return;

            IsInvulnerable = true;
            CurrentHitPoints -= data.amount;

            if (CurrentHitPoints <= 0)
                m_Schedule += onDeath.Invoke; //This avoid race condition when objects kill each other.
            else
                onReceiveDamage.Invoke();

            var messageType = CurrentHitPoints <= 0 ? MessageType.Dead : MessageType.Damaged;

            if(onDamageMessageReceivers != null)
	            onDamageMessageReceivers.RaiseEvent(messageType, data);
        }

        void LateUpdate()
        {
            if (m_Schedule != null)
            {
	            m_Schedule();
	            m_Schedule = null;
            }
        }

#if UNITY_EDITOR
        private void OnDrawGizmosSelected()
        {
	        Transform t = transform;
	        Vector3 forward = t.forward;
	        forward = Quaternion.AngleAxis(hitForwardRotation, t.up) * forward;

            if (Event.current.type == EventType.Repaint)
            {
                UnityEditor.Handles.color = Color.blue;
                UnityEditor.Handles.ArrowHandleCap(0, transform.position, Quaternion.LookRotation(forward), 1.0f,
                    EventType.Repaint);
            }


            UnityEditor.Handles.color = new Color(1.0f, 0.0f, 0.0f, 0.5f);
            var up = t.up;
            forward = Quaternion.AngleAxis(-hitAngle * 0.5f, up) * forward;
            UnityEditor.Handles.DrawSolidArc(t.position, up, forward, hitAngle, 1.0f);
        }
#endif
    }

}
