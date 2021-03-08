using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Gamekit3D;
public class ParticleCollisionListener : MonoBehaviour
{
    [SerializeField] int damageAmount = 1;
    private ParticleSystem part;
    private List<ParticleCollisionEvent> collisionEvents;

    void Start()
    {
        part = GetComponent<ParticleSystem>();
        collisionEvents = new List<ParticleCollisionEvent>();
    }

    void OnParticleCollision(GameObject other)
    {
        int numCollisionEvents = part.GetCollisionEvents(other, collisionEvents);

        for (int i = 0; i < numCollisionEvents; i++)
        {
            SendDamageMessage(other);
        }
    }
    void SendDamageMessage(GameObject other)
    {
        var d = other.GetComponent<Damageable>();
        if (d == null)
            return;

        var msg = new Damageable.DamageMessage()
        {
            amount = damageAmount,
            damager = this,
            direction = Vector3.up,
            stopCamera = false
        };

        d.ApplyDamage(msg);
    }
}
