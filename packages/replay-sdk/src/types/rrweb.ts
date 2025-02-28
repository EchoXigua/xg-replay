type ClassOption = string | RegExp;

/**
 * 这里是一些部分 rrweb 配置，在sdk中会重点使用
 * 主要涉及到隐私保护、数据屏蔽和 DOM 操作的过滤
 */
export type RrwebRecordOptions = {
  /** 是否屏蔽所有文本，包括所有的文本节点、HTML 元素中的文本内容 */
  maskAllText?: boolean;
  /** 是否屏蔽所有表单输入（例如密码框中的内容） */
  maskAllInputs?: boolean;

  /** 设置阻止记录的 CSS 类，只有不包含此类的元素会被记录 */
  blockClass?: ClassOption;
  /**
   * 设置忽略记录的 CSS 类，匹配该类的元素将被忽略
   * 和 blockClass 类似，但主要用于在录制时过滤掉某些 DOM 元素，避免录制一些无关内容
   */
  ignoreClass?: string;
  /** 具有这些类名的元素中的文本内容应该被遮蔽 */
  maskTextClass?: ClassOption;
  /** 是一个 CSS 选择器，用于指定哪些元素中的文本应该被遮蔽 */
  maskTextSelector?: string;
  blockSelector?: string;
  /** 定哪些类型的输入框需要进行遮蔽 */
  maskInputOptions?: Record<string, boolean>;
} & Record<string, unknown>;
