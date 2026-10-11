import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "./Button";
export function Gallery({ items }) {
  return (
    <div className="archive-grid">
      {items.map((item, i) => (
        <Dialog.Root key={item.id}>
          <Dialog.Trigger asChild>
            <button className="gallery-trigger">
              <div className={"art-placeholder art-" + i}>
                {item.image ? (
                  <img src={item.image} alt={item.title} />
                ) : (
                  <>
                    <span>{item.word}</span>
                    <small>壁画展示位 / 待添加图片</small>
                  </>
                )}
              </div>
              <div className="gallery-label">
                <span>
                  {item.title}
                  <small>{item.caption}</small>
                </span>
                <span>↗</span>
              </div>
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="dialog-overlay" />
            <Dialog.Content className="dialog-content">
              <Dialog.Title>{item.title}</Dialog.Title>
              <Dialog.Description>
                {item.caption} ·{" "}
                {item.image
                  ? "作品展示"
                  : "尚未添加壁画图片，此处是国风排版占位。"}
              </Dialog.Description>
              {item.image ? (
                <img
                  className="dialog-image"
                  src={item.image}
                  alt={item.title}
                />
              ) : (
                <div className={"art-placeholder art-" + i}>
                  <span>{item.word}</span>
                </div>
              )}
              <p>{item.description}</p>
              <Dialog.Close asChild>
                <Button variant="outline">关闭展签</Button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ))}
    </div>
  );
}
