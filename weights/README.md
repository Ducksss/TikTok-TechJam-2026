# Weights

Place the four complete expert model state dictionaries in this directory.

Download mirror:

- Baidu Netdisk: <https://pan.baidu.com/s/1z4FfdeLJOu9PI0wks4vgqQ>
- Extraction code: `4dqe`

The current inference code uses only the four `.pth` files below.
The upstream model architectures are available for reference at
[`openai/clip-vit-large-patch14`](https://huggingface.co/openai/clip-vit-large-patch14)
and
[`google/siglip-so400m-patch14-384`](https://huggingface.co/google/siglip-so400m-patch14-384).

## License and redistribution boundary

The four fine-tuned `Expert_*.pth` files are **not** distributed by this Git
repository. The external mirror is a download location, not evidence that the
checkpoint copyright holder granted redistribution rights. No explicit
license covering those four fine-tuned files was located during the
2026-08-31 release audit.

Download and use the checkpoints only when you are authorized to do so. Do not
re-upload, bundle, sell, or mirror them without written permission from the
checkpoint rights holder. The license of a base architecture or implementation
does not automatically license a downstream fine-tuned checkpoint.

See the [model card](../submission/MODEL_CARD.md),
[third-party notices](../submission/THIRD_PARTY_NOTICES.md), and
[release audit](../submission/RELEASE_AUDIT.md).
