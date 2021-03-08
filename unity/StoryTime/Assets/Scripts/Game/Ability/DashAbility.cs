using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Gamekit3D;
using UnityEngine.Rendering;
using DG.Tweening;
using Cinemachine;

public class DashAbility : AbilityBase
{
    [Header("Connections")]
    [SerializeField] public CinemachineFreeLook originalCam = default;
    [SerializeField] public Volume dashVolume = default;

    [SerializeField] private Animator animator = default;
    [SerializeField] private MeleeWeapon weapon = default;
    [SerializeField] private Damageable damageable = default;
    [Header("Visuals")]
    [SerializeField] private Renderer skinnedMesh = default;
    [SerializeField] private ParticleSystem dashParticle = default;
    public override void Ability()
    {
        animator.SetTrigger("Dash");
        dashParticle.Play();

        Sequence dash = DOTween.Sequence()
        .AppendCallback(() => damageable.isInvulnerable = true)
        .AppendCallback(() => SetWeaponHitbox(3))
        .Insert(0, transform.DOMove(transform.position + (transform.forward * 5), .2f))
        .AppendCallback(() => dashParticle.Stop())
        .Insert(0, skinnedMesh.material.DOFloat(1, "FresnelAmount", .1f))
        .Append(skinnedMesh.material.DOFloat(0, "FresnelAmount", .35f))
        .AppendCallback(() => SetWeaponHitbox(0.45f))
        .AppendCallback(() => damageable.isInvulnerable = false);


        DOVirtual.Float(0, 1, .1f, SetDashVolumeWeight)
            .OnComplete(() => DOVirtual.Float(1, 0, .5f, SetDashVolumeWeight));

        DOVirtual.Float(40, 50, .1f, SetCameraFOV)
            .OnComplete(() => DOVirtual.Float(50, 40, .5f, SetCameraFOV));
    }

    void SetDashVolumeWeight(float weight)
    {
        dashVolume.weight = weight;
    }

    void SetCameraFOV(float fov)
    {
        originalCam.m_Lens.FieldOfView = fov;
    }
    void SetWeaponHitbox(float size)
    {
        foreach (var point in weapon.attackPoints)
            point.radius = size;
    }
}
