import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';
import { StandardPage } from '../components/layout/StandardPage';
import { GlassBlock } from '../components/layout/GlassBlock';
import { GlassButton } from '../components/glass/GlassButton';
import { vi } from '../i18n/vi';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <StandardPage
      title={vi.common.notFound || 'Không tìm thấy trang'}
      description="Liên kết này không tồn tại hoặc đã bị thay đổi"
      layoutTemplate="form"
      testId="not-found-page"
    >
      <GlassBlock
        title="404"
        subtitle="Trang không tồn tại"
        icon={<AlertCircle className="w-5 h-5 text-[#D64560]" />}
        bodyClassName="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4"
      >
        <div className="w-16 h-16 rounded-full bg-[#D64560]/10 flex items-center justify-center text-[#D64560]">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h2 className="text-base sm:text-lg font-semibold text-[#3B2A33]">Không tìm thấy trang yêu cầu</h2>
          <p className="text-xs text-[#826B76]">
            Đường dẫn bạn truy cập hiện không khả dụng. Vui lòng kiểm tra lại địa chỉ hoặc trở về trang chủ.
          </p>
        </div>
        <div className="pt-2">
          <GlassButton
            variant="primary"
            size="md"
            leftIcon={<Home className="w-4 h-4" />}
            onClick={() => navigate('/')}
          >
            Về trang chủ
          </GlassButton>
        </div>
      </GlassBlock>
    </StandardPage>
  );
};

export default NotFoundPage;
