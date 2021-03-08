using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Animations.Rigging;
using DG.Tweening;

public class ParticleAbility : AbilityBase
{
    [Header("Connections")]
    [SerializeField] ParticleSystem particle = default;
    [SerializeField] private TwoBoneIKConstraint shootRig = default;
    public override void Ability()
    {
        particle.Play();

        if (!shootRig)
            return;

        DOVirtual.Float(0, 1, .1f, (x) => shootRig.weight = x).OnComplete(() => DOVirtual.Float(1, 0, .3f, (x) => shootRig.weight = x));
    }
}
