using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

public abstract class AbilityBase : MonoBehaviour
{
    public class MyFloatEvent : UnityEvent<float> { }
    public MyFloatEvent OnAbilityUse = new MyFloatEvent();
    [Header("Ability Info")]
    public string title;
    public Sprite icon;
    public float cooldownTime = 1;
    private bool canUse = true;


    public void TriggerAbility()
    {
        if (canUse)
        {
            OnAbilityUse.Invoke(cooldownTime);
            Ability();
            StartCooldown();
        }

    }
    public abstract void Ability();
    void StartCooldown()
    {
        StartCoroutine(Cooldown());
        IEnumerator Cooldown()
        {
            canUse = false;
            yield return new WaitForSeconds(cooldownTime);
            canUse = true;
        }
    }
}
